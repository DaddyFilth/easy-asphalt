use eframe::egui;
use std::sync::mpsc;

#[derive(Clone, Copy, PartialEq, Eq)]
enum View {
    Dashboard,
    RunJob,
    History,
    Settings,
}

enum JobStatus {
    Idle,
    Running,
    Done(String),
    Error(String),
}

pub struct EasyAsphaltApp {
    current_view: View,
    input_path: String,
    output_path: String,
    default_output_path: String,
    status: JobStatus,
    last_result: Option<String>,
    rx: Option<mpsc::Receiver<JobStatus>>,
}

impl EasyAsphaltApp {
    pub fn new(_cc: &eframe::CreationContext<'_>) -> Self {
        Self {
            current_view: View::Dashboard,
            input_path: String::new(),
            output_path: String::new(),
            default_output_path: String::new(),
            status: JobStatus::Idle,
            last_result: None,
            rx: None,
        }
    }

    fn start_job(&mut self) {
        if self.input_path.trim().is_empty() || self.output_path.trim().is_empty() {
            self.status = JobStatus::Error("Input and output paths are required.".to_string());
            return;
        }

        let (tx, rx) = mpsc::channel();
        let input = self.input_path.clone();
        let output = self.output_path.clone();

        self.status = JobStatus::Running;
        self.rx = Some(rx);

        std::thread::spawn(move || {
            let cfg = crate::core::Config {
                input_path: input,
                output_path: output.clone(),
            };

            let res = crate::core::run(cfg);

            let _ = match res {
                Ok(_) => tx.send(JobStatus::Done(format!("Wrote to {output}"))),
                Err(e) => tx.send(JobStatus::Error(e.to_string())),
            };
        });
    }

    fn poll_job(&mut self, ctx: &egui::Context) {
        if let Some(rx) = &self.rx {
            if let Ok(msg) = rx.try_recv() {
                match &msg {
                    JobStatus::Done(text) => self.last_result = Some(text.clone()),
                    JobStatus::Error(text) => self.last_result = Some(format!("Error: {text}")),
                    _ => {}
                }

                self.status = msg;
                self.rx = None;
                ctx.request_repaint();
            }
        }
    }

    fn nav_button(ui: &mut egui::Ui, selected: bool, label: &str) -> egui::Response {
        ui.selectable_label(selected, label)
    }

    fn render_sidebar(&mut self, ctx: &egui::Context) {
        egui::SidePanel::left("sidebar")
            .resizable(false)
            .default_width(180.0)
            .show(ctx, |ui| {
                ui.heading("Easy-Asphalt");
                ui.label("Estimator Pro");
                ui.separator();

                if Self::nav_button(ui, self.current_view == View::Dashboard, "Dashboard").clicked() {
                    self.current_view = View::Dashboard;
                }
                if Self::nav_button(ui, self.current_view == View::RunJob, "Run Job").clicked() {
                    self.current_view = View::RunJob;
                }
                if Self::nav_button(ui, self.current_view == View::History, "History").clicked() {
                    self.current_view = View::History;
                }
                if Self::nav_button(ui, self.current_view == View::Settings, "Settings").clicked() {
                    self.current_view = View::Settings;
                }

                ui.with_layout(egui::Layout::bottom_up(egui::Align::LEFT), |ui| {
                    ui.separator();
                    match &self.status {
                        JobStatus::Idle => {
                            ui.label("Status: Idle");
                        }
                        JobStatus::Running => {
                            ui.label("Status: Running");
                            ui.add(egui::Spinner::new());
                        }
                        JobStatus::Done(_) => {
                            ui.colored_label(egui::Color32::GREEN, "Status: Done");
                        }
                        JobStatus::Error(_) => {
                            ui.colored_label(egui::Color32::RED, "Status: Error");
                        }
                    }
                });
            });
    }

    fn render_dashboard(&mut self, ui: &mut egui::Ui) {
        ui.heading("Dashboard");
        ui.label("Choose a function from the left, or use the quick actions below.");
        ui.add_space(8.0);

        ui.horizontal_wrapped(|ui| {
            if ui.button("Open Run Job").clicked() {
                self.current_view = View::RunJob;
            }
            if ui.button("Open History").clicked() {
                self.current_view = View::History;
            }
            if ui.button("Open Settings").clicked() {
                self.current_view = View::Settings;
            }
        });

        ui.separator();
        ui.group(|ui| {
            ui.label("Current input:");
            ui.monospace(if self.input_path.is_empty() { "(none)" } else { &self.input_path });

            ui.label("Current output:");
            ui.monospace(if self.output_path.is_empty() { "(none)" } else { &self.output_path });
        });

        ui.add_space(8.0);
        match &self.status {
            JobStatus::Idle => {
                ui.label("No job has been started yet.");
            }
            JobStatus::Running => {
                ui.label("A job is currently running.");
                ui.add(egui::Spinner::new());
            }
            JobStatus::Done(msg) => {
                ui.colored_label(egui::Color32::GREEN, msg);
            }
            JobStatus::Error(msg) => {
                ui.colored_label(egui::Color32::RED, msg);
            }
        }
    }

    fn render_run_job(&mut self, ui: &mut egui::Ui) {
        ui.heading("Run Job");
        ui.label("Configure paths and start processing.");
        ui.separator();

        ui.label("Input path:");
        ui.text_edit_singleline(&mut self.input_path);

        ui.label("Output path:");
        ui.text_edit_singleline(&mut self.output_path);

        let job_running = matches!(self.status, JobStatus::Running);

        ui.add_space(8.0);
        if ui.add_enabled(!job_running, egui::Button::new("Run Processing")).clicked() {
            self.start_job();
        }

        ui.add_space(8.0);
        match &self.status {
            JobStatus::Idle => {
                ui.label("Ready.");
            }
            JobStatus::Running => {
                ui.horizontal(|ui| {
                    ui.add(egui::Spinner::new());
                    ui.label("Working...");
                });
            }
            JobStatus::Done(msg) => {
                ui.colored_label(egui::Color32::GREEN, msg);
            }
            JobStatus::Error(msg) => {
                ui.colored_label(egui::Color32::RED, msg);
            }
        }
    }

    fn render_history(&mut self, ui: &mut egui::Ui) {
        ui.heading("History");
        ui.label("Latest job result.");
        ui.separator();

        if let Some(result) = &self.last_result {
            ui.monospace(result);
        } else {
            ui.label("No completed jobs yet.");
        }
    }

    fn render_settings(&mut self, ui: &mut egui::Ui) {
        ui.heading("Settings");
        ui.label("Default values for future runs.");
        ui.separator();

        ui.label("Default output path:");
        ui.text_edit_singleline(&mut self.default_output_path);

        if ui.button("Apply default output to current job").clicked() {
            if !self.default_output_path.trim().is_empty() {
                self.output_path = self.default_output_path.clone();
            }
        }
    }
}

impl eframe::App for EasyAsphaltApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.poll_job(ctx);
        self.render_sidebar(ctx);

        egui::CentralPanel::default().show(ctx, |ui| {
            match self.current_view {
                View::Dashboard => self.render_dashboard(ui),
                View::RunJob => self.render_run_job(ui),
                View::History => self.render_history(ui),
                View::Settings => self.render_settings(ui),
            }
        });
    }
}
