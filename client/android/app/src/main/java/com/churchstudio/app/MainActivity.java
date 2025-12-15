// android/app/src/main/java/com/churchstudio/app/MainActivity.java
package com.churchstudio.app;

import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Window;

import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private volatile boolean keepSplash = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splash = SplashScreen.installSplashScreen(this);
        splash.setKeepOnScreenCondition(() -> keepSplash);

        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // === KEY PART ===
        // Make the app draw BEHIND system bars (Facebook-style)
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Full transparent navigation bar
        window.setNavigationBarColor(Color.TRANSPARENT);
        window.setStatusBarColor(Color.TRANSPARENT);

        // Icons: dark for light backgrounds, light for dark backgrounds
        WindowInsetsControllerCompat insets =
                new WindowInsetsControllerCompat(window, window.getDecorView());
        insets.setAppearanceLightNavigationBars(false); // white nav icons
        insets.setAppearanceLightStatusBars(false);     // white status icons

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            keepSplash = false;
            setTheme(R.style.Theme_TheChurchStudio);
            window.setBackgroundDrawable(null);

            // Re-apply after splash
            WindowCompat.setDecorFitsSystemWindows(window, false);
            window.setNavigationBarColor(Color.TRANSPARENT);
            window.setStatusBarColor(Color.TRANSPARENT);
            insets.setAppearanceLightNavigationBars(false);
            insets.setAppearanceLightStatusBars(false);

        }, 1000);
    }
}
