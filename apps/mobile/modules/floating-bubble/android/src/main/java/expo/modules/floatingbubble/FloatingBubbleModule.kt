package expo.modules.floatingbubble

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.drawable.AdaptiveIconDrawable
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlin.math.abs
import kotlin.math.min
import kotlin.math.roundToInt

// 다른 앱 위에 떠 있는 MOA 플로팅 버블.
// 탭하면 앱으로 전환되지 않고, 버블 자리에서 WebView 패널로 확장되어 빠른 추가 UI(/overlay/quick-add)를 띄운다.
// 버블 표시/숨김은 JS(AppState)가 제어하고, 확장/축소는 터치로 내부에서 처리한다.
class FloatingBubbleModule : Module() {
  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  private val mainHandler = Handler(Looper.getMainLooper())

  private var rootView: FrameLayout? = null
  private var bubbleView: View? = null
  private var webView: WebView? = null
  private var expanded = false

  // 버블(축소) 마지막 위치. 최초 표시 전엔 화면 우측 하단을 기본값으로 잡는다.
  private var positioned = false
  private var lastX = 24
  private var lastY = 320

  private val windowManager: WindowManager
    get() = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

  private val overlayType =
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      @Suppress("DEPRECATION")
      WindowManager.LayoutParams.TYPE_PHONE
    }

  override fun definition() = ModuleDefinition {
    Name("FloatingBubble")

    Function("hasOverlayPermission") { Settings.canDrawOverlays(context) }

    Function("requestOverlayPermission") {
      mainHandler.post {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:" + context.packageName)
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
          context.startActivity(intent)
        } catch (e: Exception) {
        }
      }
    }

    Function("show") { mainHandler.post { showBubble() } }
    // 패널이 펼쳐진 동안엔 hide를 무시한다. 파일 선택(프록시 Activity) 복귀 등
    // 일시적 AppState 'active' 신호로 사용 중인 패널이 닫히는 것을 막는다.
    // (앱을 진짜로 열면 패널은 닫기 버튼/BACK으로 닫는다.)
    Function("hide") { mainHandler.post { if (!expanded) removeOverlay() } }

    OnDestroy { mainHandler.post { removeOverlay() } }
  }

  // ── 표시/제거 ───────────────────────────────────────────────

  private fun showBubble() {
    if (!Settings.canDrawOverlays(context)) return
    if (rootView != null) return

    if (!positioned) {
      val dm = context.resources.displayMetrics
      val sizePx = dp(60)
      lastX = dm.widthPixels - sizePx - dp(20)
      lastY = dm.heightPixels - sizePx - dp(160)
      positioned = true
    }

    // BACK 키로 패널을 닫기 위해 dispatchKeyEvent를 가로채는 루트 컨테이너.
    val root = object : FrameLayout(context) {
      override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (expanded && event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
          collapse()
          return true
        }
        return super.dispatchKeyEvent(event)
      }
    }
    val bubble = buildBubble()
    root.addView(bubble)

    val params = collapsedParams()
    attachBubbleTouch(root, bubble, params)

    try {
      windowManager.addView(root, params)
      rootView = root
      bubbleView = bubble
      expanded = false
    } catch (e: Exception) {
      rootView = null
    }
  }

  private fun removeOverlay() {
    webView?.let {
      it.loadUrl("about:blank")
      it.destroy()
    }
    webView = null
    val root = rootView ?: return
    try {
      windowManager.removeView(root)
    } catch (e: Exception) {
    }
    rootView = null
    bubbleView = null
    expanded = false
  }

  // ── 확장 / 축소 ─────────────────────────────────────────────

  private fun expand() {
    val root = rootView ?: return
    if (expanded) return
    expanded = true

    val web = buildWebView()
    webView = web
    val panel = buildPanel(web)

    root.removeAllViews()
    root.addView(panel, FrameLayout.LayoutParams(MATCH, MATCH))

    try {
      windowManager.updateViewLayout(root, expandedParams())
    } catch (e: Exception) {
    }
    web.loadUrl(OVERLAY_URL)
  }

  private fun collapse() {
    val root = rootView ?: return
    if (!expanded) return
    expanded = false

    webView?.let {
      it.loadUrl("about:blank")
      it.destroy()
    }
    webView = null

    root.removeAllViews()
    val bubble = buildBubble()
    bubbleView = bubble
    root.addView(bubble)

    val params = collapsedParams()
    attachBubbleTouch(root, bubble, params)
    try {
      windowManager.updateViewLayout(root, params)
    } catch (e: Exception) {
    }
  }

  // ── 뷰 빌드 ─────────────────────────────────────────────────

  private fun buildBubble(): View {
    val container = FrameLayout(context).apply {
      background = GradientDrawable().apply {
        shape = GradientDrawable.OVAL
        setColor(Color.WHITE)
        setStroke(dp(1), Color.parseColor("#22000000"))
      }
      clipToOutline = true
      val pad = dp(6)
      setPadding(pad, pad, pad, pad)
      elevation = dp(6).toFloat()
    }
    val iconSize = dp(48)
    val icon = ImageView(context).apply {
      // 런처 어댑티브 아이콘은 기기마다 다른 시스템 마스크가 적용돼 원형 버블과 모양이 어긋난다.
      // 시스템 마스크를 무시하고 배경+전경을 직접 그린 뒤 우리가 만든 원형으로 잘라 넣는다.
      setImageBitmap(appIconCircularBitmap(iconSize))
      scaleType = ImageView.ScaleType.FIT_CENTER
    }
    container.addView(icon, FrameLayout.LayoutParams(iconSize, iconSize))
    return container
  }

  // 앱 아이콘을 깔끔한 원형 비트맵으로 렌더링한다.
  // 어댑티브 아이콘이면 시스템 마스크 대신 배경+전경 레이어만 그려 원형으로 클립한다.
  private fun appIconCircularBitmap(sizePx: Int): Bitmap {
    val drawable = context.packageManager.getApplicationIcon(context.packageName)

    val source = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val sc = Canvas(source)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && drawable is AdaptiveIconDrawable) {
      drawable.background?.apply {
        setBounds(0, 0, sizePx, sizePx)
        draw(sc)
      }
      drawable.foreground?.apply {
        setBounds(0, 0, sizePx, sizePx)
        draw(sc)
      }
    } else {
      drawable.setBounds(0, 0, sizePx, sizePx)
      drawable.draw(sc)
    }

    val output = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val oc = Canvas(output)
    val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    val radius = sizePx / 2f
    oc.drawCircle(radius, radius, radius, paint)
    paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
    oc.drawBitmap(source, 0f, 0f, paint)
    return output
  }

  private fun buildPanel(web: WebView): View {
    val panel = LinearLayout(context).apply {
      orientation = LinearLayout.VERTICAL
      background = GradientDrawable().apply {
        shape = GradientDrawable.RECTANGLE
        setColor(Color.WHITE)
        cornerRadius = dp(20).toFloat()
      }
      clipToOutline = true
      elevation = dp(10).toFloat()
    }

    val header = LinearLayout(context).apply {
      orientation = LinearLayout.HORIZONTAL
      gravity = Gravity.CENTER_VERTICAL
      setPadding(dp(16), dp(12), dp(8), dp(12))
    }
    val title = TextView(context).apply {
      text = "빠른 추가"
      setTextColor(Color.parseColor("#1A1A1A"))
      textSize = 16f
    }
    val close = TextView(context).apply {
      text = "✕"
      setTextColor(Color.parseColor("#666666"))
      textSize = 18f
      setPadding(dp(12), dp(4), dp(12), dp(4))
      isClickable = true
      setOnClickListener { collapse() }
    }
    header.addView(title, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
    header.addView(
      close,
      LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
    )

    panel.addView(header, LinearLayout.LayoutParams(MATCH, ViewGroup.LayoutParams.WRAP_CONTENT))
    panel.addView(web, LinearLayout.LayoutParams(MATCH, 0, 1f))
    return panel
  }

  private fun buildWebView(): WebView {
    val web = WebView(context)
    web.settings.apply {
      javaScriptEnabled = true
      domStorageEnabled = true
      mediaPlaybackRequiresUserGesture = false
    }
    CookieManager.getInstance().setAcceptCookie(true)
    CookieManager.getInstance().setAcceptThirdPartyCookies(web, true)
    web.webViewClient = object : WebViewClient() {
      // 패널 내 '앱에서 내역 보기' 버튼 등 uandi:// 딥링크는 WebView에서 열지 않고
      // MOA 앱을 띄워 해당 페이지로 보낸다.
      override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
        val uri = request?.url ?: return false
        if (uri.scheme == "uandi") {
          openAppDeepLink(uri)
          return true
        }
        return false
      }
    }
    web.webChromeClient = object : WebChromeClient() {
      override fun onShowFileChooser(
        webView: WebView?,
        filePathCallback: ValueCallback<Array<Uri>>?,
        fileChooserParams: FileChooserParams?,
      ): Boolean {
        val accept = fileChooserParams?.acceptTypes?.joinToString(",").orEmpty()
        val allowCamera =
          accept.isBlank() || accept.contains("image") || fileChooserParams?.isCaptureEnabled == true
        // 파일 chooser가 패널에 가려 안 눌리는 문제 방지: 선택 동안 패널을 투명+터치 통과로
        // 비켜 두고(WebView는 유지), 선택이 끝나면 복원한다.
        setChooserMode(true)
        FileChooserBridge.start(context, filePathCallback, allowCamera) {
          mainHandler.post { setChooserMode(false) }
        }
        return true
      }

      // WebView 콘솔(에러 포함)을 logcat으로 — 이미지 처리 실패 등 진단용.
      override fun onConsoleMessage(message: ConsoleMessage): Boolean {
        Log.d(
          "FloatingBubbleWeb",
          "${message.message()} @${message.sourceId()}:${message.lineNumber()}"
        )
        return true
      }
    }
    return web
  }

  // ── 터치(버블 드래그/탭) ─────────────────────────────────────

  private fun attachBubbleTouch(root: View, bubble: View, params: WindowManager.LayoutParams) {
    var initialX = 0
    var initialY = 0
    var touchX = 0f
    var touchY = 0f
    var moved = false
    val touchSlop = dp(8)

    bubble.setOnTouchListener { v, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          initialX = params.x
          initialY = params.y
          touchX = event.rawX
          touchY = event.rawY
          moved = false
          true
        }

        MotionEvent.ACTION_MOVE -> {
          val dx = (event.rawX - touchX).roundToInt()
          val dy = (event.rawY - touchY).roundToInt()
          if (abs(dx) > touchSlop || abs(dy) > touchSlop) moved = true
          params.x = initialX + dx
          params.y = initialY + dy
          try {
            windowManager.updateViewLayout(root, params)
          } catch (e: Exception) {
          }
          true
        }

        MotionEvent.ACTION_UP -> {
          lastX = params.x
          lastY = params.y
          if (!moved) {
            v.performClick()
            expand()
          }
          true
        }

        else -> false
      }
    }
  }

  // ── 윈도우 파라미터 ─────────────────────────────────────────

  private fun collapsedParams(): WindowManager.LayoutParams {
    return WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      overlayType,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = lastX
      y = lastY
    }
  }

  private fun expandedParams(): WindowManager.LayoutParams {
    val dm = context.resources.displayMetrics
    val width = min(dm.widthPixels - dp(24), dp(420))
    // 내역 추가에 부담 없는 컴팩트한 높이(작은 화면에선 비율, 큰 화면에선 상한).
    val height = min((dm.heightPixels * 0.55f).roundToInt(), dp(460))
    return WindowManager.LayoutParams(
      width,
      height,
      overlayType,
      // 포커스 가능(키보드 입력) — FLAG_NOT_FOCUSABLE를 두지 않는다.
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT
    ).apply {
      gravity = Gravity.CENTER
      x = 0
      y = 0
      softInputMode =
        WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE or
        WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN
    }
  }

  // 파일 선택 동안 오버레이 패널을 투명+터치 통과로 비켜 둔다(아래 chooser가 보이고 눌리도록).
  // WebView는 그대로 유지되어 입력/콜백이 보존되며, 선택 후 다시 보이게 복원한다.
  private fun setChooserMode(active: Boolean) {
    val root = rootView ?: return
    val params = root.layoutParams as? WindowManager.LayoutParams ?: return
    if (active) {
      params.alpha = 0f
      params.flags = params.flags or
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
    } else {
      params.alpha = 1f
      // chooser는 항상 확장(패널) 상태에서만 뜨므로 확장 플래그(포커스 가능)로 복원.
      params.flags = WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
    }
    try {
      windowManager.updateViewLayout(root, params)
    } catch (e: Exception) {
    }
  }

  // 패널 버튼이 uandi:// 딥링크로 이동하면 MOA 앱을 열어 해당 페이지로 보내고 패널을 닫는다.
  private fun openAppDeepLink(uri: Uri) {
    val intent = Intent(Intent.ACTION_VIEW, uri).apply {
      setPackage(context.packageName)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }
    try {
      context.startActivity(intent)
    } catch (e: Exception) {
    }
    // WebView 콜백 내부이므로 collapse(WebView 파괴 포함)는 다음 루프로 미룬다.
    mainHandler.post { collapse() }
  }

  private fun dp(value: Int): Int =
    (value * context.resources.displayMetrics.density).roundToInt()

  companion object {
    private const val OVERLAY_URL = "https://uandi-web.vercel.app/overlay/quick-add"
    private const val MATCH = ViewGroup.LayoutParams.MATCH_PARENT
  }
}
