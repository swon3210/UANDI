package expo.modules.floatingbubble

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import androidx.core.content.FileProvider
import java.io.File

// 오버레이 WebView의 파일 입력(<input type=file accept=image/*>)을 처리하는 투명 프록시 Activity.
// Service 컨텍스트엔 Activity가 없어 피커를 못 띄우므로, 여기서 갤러리/카메라 chooser를 실행하고
// 결과 URI를 FileChooserBridge를 통해 WebView 콜백으로 돌려준다.
class FileChooserActivity : Activity() {
  companion object {
    const val EXTRA_ALLOW_CAMERA = "allow_camera"
    private const val REQ_CHOOSER = 1001
    private const val REQ_CAMERA_PERMISSION = 1002
  }

  private var cameraUri: Uri? = null
  private var cameraFile: File? = null
  private var allowCamera = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    allowCamera = intent.getBooleanExtra(EXTRA_ALLOW_CAMERA, false)

    if (allowCamera && needsCameraPermission()) {
      requestPermissions(arrayOf(Manifest.permission.CAMERA), REQ_CAMERA_PERMISSION)
    } else {
      launchChooser()
    }
  }

  // 매니페스트에 CAMERA가 선언된 경우에만 런타임 권한이 필요하다.
  private fun needsCameraPermission(): Boolean {
    val declared = try {
      val info = packageManager.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
      info.requestedPermissions?.contains(Manifest.permission.CAMERA) == true
    } catch (e: Exception) {
      false
    }
    if (!declared) return false
    return checkSelfPermission(Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED
  }

  override fun onRequestPermissionsResult(
    requestCode: Int,
    permissions: Array<out String>,
    grantResults: IntArray,
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults)
    if (requestCode == REQ_CAMERA_PERMISSION) {
      // 거부해도 갤러리 선택은 가능하도록 카메라만 제외하고 진행한다.
      if (grantResults.isEmpty() || grantResults[0] != PackageManager.PERMISSION_GRANTED) {
        allowCamera = false
      }
      launchChooser()
    }
  }

  private fun launchChooser() {
    val contentIntent = Intent(Intent.ACTION_GET_CONTENT).apply {
      type = "image/*"
      addCategory(Intent.CATEGORY_OPENABLE)
      putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
    }

    val cameraIntents = mutableListOf<Intent>()
    if (allowCamera) {
      val captureIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
      if (captureIntent.resolveActivity(packageManager) != null) {
        val uri = createCameraOutputUri()
        if (uri != null) {
          cameraUri = uri
          captureIntent.putExtra(MediaStore.EXTRA_OUTPUT, uri)
          captureIntent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
          cameraIntents.add(captureIntent)
        }
      }
    }

    val chooser = Intent.createChooser(contentIntent, "이미지 선택").apply {
      if (cameraIntents.isNotEmpty()) {
        putExtra(Intent.EXTRA_INITIAL_INTENTS, cameraIntents.toTypedArray())
      }
    }

    try {
      startActivityForResult(chooser, REQ_CHOOSER)
    } catch (e: Exception) {
      finishWith(null)
    }
  }

  private fun createCameraOutputUri(): Uri? {
    return try {
      val dir = File(cacheDir, "bubble-capture").apply { mkdirs() }
      val file = File(dir, "capture_${System.nanoTime()}.jpg")
      cameraFile = file
      FileProvider.getUriForFile(this, "$packageName.floatingbubble.fileprovider", file)
    } catch (e: Exception) {
      null
    }
  }

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)
    if (requestCode != REQ_CHOOSER || resultCode != RESULT_OK) {
      finishWith(null)
      return
    }
    finishWith(extractUris(data))
  }

  // 선택 결과를 WebView가 나중에도 읽을 수 있는 URI로 변환한다.
  // 갤러리/문서의 외부 앱 소유 content URI는 이 Activity가 끝나면 읽기 권한이 회수돼
  // WebView가 파일을 읽지 못하므로, 우리 앱 캐시로 복사해 우리 FileProvider URI로 넘긴다.
  // (카메라 촬영분은 이미 우리 FileProvider(cameraUri)에 저장됨.)
  private fun extractUris(data: Intent?): Array<Uri>? {
    val sources = ArrayList<Uri>()
    data?.clipData?.let { clip ->
      for (i in 0 until clip.itemCount) sources.add(clip.getItemAt(i).uri)
    }
    if (sources.isEmpty()) data?.data?.let { sources.add(it) }

    if (sources.isNotEmpty()) {
      val copied = sources.mapNotNull { copyToCache(it) }
      return if (copied.isEmpty()) null else copied.toTypedArray()
    }

    // 카메라 촬영: data가 비어 있고 EXTRA_OUTPUT(cameraUri)에 저장됨
    cameraFile?.let { if (it.exists() && it.length() > 0) return arrayOf(cameraUri!!) }
    return null
  }

  // 외부 content URI를 우리 앱 캐시 파일로 복사하고, 우리 FileProvider URI를 반환한다.
  private fun copyToCache(uri: Uri): Uri? {
    return try {
      val dir = File(cacheDir, "bubble-capture").apply { mkdirs() }
      val ext = contentResolver.getType(uri)?.substringAfterLast('/')
        ?.takeIf { it.isNotBlank() && it.length <= 5 } ?: "jpg"
      val file = File(dir, "pick_${System.nanoTime()}.$ext")
      contentResolver.openInputStream(uri)?.use { input ->
        file.outputStream().use { output -> input.copyTo(output) }
      } ?: return null
      if (file.length() == 0L) return null
      FileProvider.getUriForFile(this, "$packageName.floatingbubble.fileprovider", file)
    } catch (e: Exception) {
      null
    }
  }

  private fun finishWith(uris: Array<Uri>?) {
    FileChooserBridge.deliver(uris)
    finish()
    overridePendingTransition(0, 0)
  }
}
