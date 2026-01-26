package com.mohfos.plotter;

import android.Manifest;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  private ActivityResultLauncher<String[]> permLauncher;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    permLauncher = registerForActivityResult(
      new ActivityResultContracts.RequestMultiplePermissions(),
      result -> { /* Permissions result handled implicitly; UI reflects connection state */ }
    );

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      // Android 12+
      permLauncher.launch(new String[]{
        Manifest.permission.BLUETOOTH_CONNECT,
        Manifest.permission.BLUETOOTH_SCAN
      });
    } else {
      // Pre-Android 12: classic BT discovery needs location
      permLauncher.launch(new String[]{
        Manifest.permission.ACCESS_FINE_LOCATION
      });
    }

    // Allow mixed content for local LAN HTTP API (development)
    WebSettings settings = getBridge().getWebView().getSettings();
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
  }
}
