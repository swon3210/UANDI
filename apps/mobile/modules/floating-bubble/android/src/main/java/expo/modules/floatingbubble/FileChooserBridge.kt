package expo.modules.floatingbubble

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.webkit.ValueCallback

// 오버레이 WebView(Service 컨텍스트)는 Activity가 없어 파일/카메라 피커를 직접 띄울 수 없다.
// onShowFileChooser의 콜백을 여기 보관하고, 투명 프록시 Activity(FileChooserActivity)가
// 피커를 실행한 뒤 결과 URI를 다시 WebView로 전달한다.
object FileChooserBridge {
  private var pendingCallback: ValueCallback<Array<Uri>>? = null
  // 선택이 끝나면(결과/취소 모두) 호출 — 오버레이 패널을 다시 보이게 복원하는 용도.
  private var onComplete: (() -> Unit)? = null

  // allowCamera: 카메라 촬영을 함께 제공할지(accept image/* 이면 true).
  // onComplete: 피커 종료 시 1회 호출.
  fun start(
    context: Context,
    callback: ValueCallback<Array<Uri>>?,
    allowCamera: Boolean,
    onComplete: () -> Unit,
  ) {
    // 직전 콜백이 남아 있으면(취소 처리 누락) 빈 결과로 정리한다.
    pendingCallback?.onReceiveValue(null)
    pendingCallback = callback
    this.onComplete = onComplete

    val intent = Intent(context, FileChooserActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      putExtra(FileChooserActivity.EXTRA_ALLOW_CAMERA, allowCamera)
    }
    try {
      context.startActivity(intent)
    } catch (e: Exception) {
      deliver(null)
    }
  }

  // 프록시 Activity가 결과(또는 취소 시 null)를 전달한다.
  fun deliver(uris: Array<Uri>?) {
    pendingCallback?.onReceiveValue(uris)
    pendingCallback = null
    val complete = onComplete
    onComplete = null
    complete?.invoke()
  }
}
