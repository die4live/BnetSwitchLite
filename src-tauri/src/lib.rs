mod account_reader;
mod app_service;
mod commands;
mod contracts;
mod data_store;
mod error;
mod login_completion;
mod platform;
mod service_common;

use commands::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::new())
        .setup(|app| {
            #[cfg(windows)]
            if let Some(window) = app.get_webview_window("main") {
                let icons = platform::windows::window_icon::install(&window)?;
                app.manage(icons);

                let icon_window = window.clone();
                window.on_window_event(move |event| {
                    if matches!(event, tauri::WindowEvent::ScaleFactorChanged { .. }) {
                        let icons = icon_window
                            .state::<platform::windows::window_icon::WindowIconManager>();
                        let _ = icons.refresh(&icon_window);
                    }
                });
            }
            if let Some(window) = app.get_webview_window("main") {
                // 标题栏带上 tauri.conf.json 的 version，版本号更新时无需改这里。
                // 基准文案与 tauri.conf.json 的 app.windows[0].title 保持一致。
                let title = match app.config().version.as_deref() {
                    Some(version) if !version.is_empty() => format!("战网切号器 v{version}"),
                    _ => "战网切号器".to_string(),
                };
                let _ = window.set_title(&title);
                window.show()?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_app_snapshot,
            commands::refresh_accounts,
            commands::switch_account,
            commands::begin_login,
            commands::complete_login,
            commands::request_login_cancellation,
            commands::cancel_login,
            commands::remove_account,
            commands::set_client_path,
            commands::open_client,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
