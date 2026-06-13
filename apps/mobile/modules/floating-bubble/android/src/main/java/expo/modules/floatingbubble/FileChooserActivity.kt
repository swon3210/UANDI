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

  private fun extractUris(data: Intent?): Array<Uri>? {
    // 갤러리 다중 선택
    data?.clipData?.let { clip ->
      val list = ArrayList<Uri>()
      for (i in 0 until clip.itemCount) list.add(clip.getItemAt(i).uri)
      if (list.isNotEmpty()) return list.toTypedArray()
    }
    // 갤러리 단일 선택
    data?.data?.let { return arrayOf(it) }
    // 카메라 촬영: data가 비어 있고 EXTRA_OUTPUT에 저장됨
    cameraUri?.let { return arrayOf(it) }
    return null
  }

  private fun finishWith(uris: Array<Uri>?) {
    FileChooserBridge.deliver(uris)
    finish()
    overridePendingTransition(0, 0)
  }
}
