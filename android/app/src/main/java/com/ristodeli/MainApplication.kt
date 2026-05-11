package com.ristodeli

import android.app.Application
import android.content.res.Configuration
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader

// 💡 ESTAS SON LAS IMPORTACIONES QUE FALTAN
import expo.modules.ApplicationLifecycleDispatcher
import expo.modules.ReactNativeHostWrapper

class MainApplication : Application(), ReactApplication {

  // Implementación del Wrapper de Expo para que el Metro Bundler funcione
  override val reactNativeHost: ReactNativeHost = ReactNativeHostWrapper(this, object : DefaultReactNativeHost(this) {
    override fun getPackages(): List<ReactPackage> {
      val packages = PackageList(this).packages
      // Aquí se pueden agregar paquetes manuales si fuera necesario
      return packages
    }

    override fun getJSMainModuleName(): String = "index"

    override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

    override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
    override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
  })

  override fun onCreate() {
    super.onCreate()
    SoLoader.init(this, false)
    if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
      load()
    }
    // Inicialización de los módulos de Expo
    ApplicationLifecycleDispatcher.onApplicationCreate(this)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    super.onConfigurationChanged(newConfig)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, newConfig)
  }
}