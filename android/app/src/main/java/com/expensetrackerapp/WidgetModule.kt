package com.expensetrackerapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray

class WidgetModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "ExpenseWidget"

  @ReactMethod
  fun updateSnapshot(balance: Double, transactions: ReadableArray) {
    val prefs = context.getSharedPreferences("expense_widget", Context.MODE_PRIVATE)
    val lines = (0 until minOf(3, transactions.size())).joinToString("\n") { transactions.getString(it) ?: "" }
    prefs.edit().putString("balance", balance.toLong().toString()).putString("transactions", lines).apply()
    val manager = AppWidgetManager.getInstance(context)
    val ids = manager.getAppWidgetIds(ComponentName(context, ExpenseWidgetProvider::class.java))
    ids.forEach { ExpenseWidgetProvider.update(context, manager, it) }
  }
}
