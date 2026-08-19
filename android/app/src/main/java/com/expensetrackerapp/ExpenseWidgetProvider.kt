package com.expensetrackerapp

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews

class ExpenseWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, manager: AppWidgetManager, ids: IntArray) { ids.forEach { update(context, manager, it) } }

  companion object {
    fun update(context: Context, manager: AppWidgetManager, id: Int) {
      val prefs = context.getSharedPreferences("expense_widget", Context.MODE_PRIVATE)
      val views = RemoteViews(context.packageName, R.layout.widget_expense)
      views.setTextViewText(R.id.widget_balance, "${prefs.getString("balance", "0")} د.ع")
      views.setTextViewText(R.id.widget_transactions, prefs.getString("transactions", "لا توجد عمليات بعد") ?: "لا توجد عمليات بعد")
      val intent = Intent(context, MainActivity::class.java)
      val pending = PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
      views.setOnClickPendingIntent(R.id.widget_root, pending)
      manager.updateAppWidget(id, views)
    }
  }
}
