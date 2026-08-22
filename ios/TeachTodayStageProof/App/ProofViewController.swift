import UIKit

final class ProofViewController: UIViewController {
    enum Role {
        case teacher
        case student
    }

    private let role: Role
    private let statusLabel = UILabel()

    init(role: Role) {
        self.role = role
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        configureView()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(updateConnectionStatus),
            name: UIScreen.didConnectNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(updateConnectionStatus),
            name: UIScreen.didDisconnectNotification,
            object: nil
        )
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        updateConnectionStatus()
    }

    private func configureView() {
        let isTeacher = role == .teacher
        view.backgroundColor = isTeacher
            ? UIColor(red: 0.90, green: 0.99, blue: 0.97, alpha: 1)
            : UIColor(red: 0.08, green: 0.20, blue: 0.46, alpha: 1)

        let badge = UILabel()
        badge.translatesAutoresizingMaskIntoConstraints = false
        badge.text = isTeacher ? "A" : "B"
        badge.textAlignment = .center
        badge.font = .systemFont(ofSize: 76, weight: .black)
        badge.textColor = isTeacher ? .white : UIColor(red: 0.08, green: 0.20, blue: 0.46, alpha: 1)
        badge.backgroundColor = isTeacher
            ? UIColor(red: 0.04, green: 0.49, blue: 0.45, alpha: 1)
            : UIColor(red: 0.91, green: 0.96, blue: 1, alpha: 1)
        badge.layer.cornerRadius = 70
        badge.clipsToBounds = true

        let titleLabel = UILabel()
        titleLabel.text = isTeacher ? "TEACHER SCREEN" : "STUDENT STAGE"
        titleLabel.textAlignment = .center
        titleLabel.font = .systemFont(ofSize: 52, weight: .black)
        titleLabel.textColor = isTeacher
            ? UIColor(red: 0.04, green: 0.28, blue: 0.28, alpha: 1)
            : .white
        titleLabel.adjustsFontSizeToFitWidth = true
        titleLabel.minimumScaleFactor = 0.55

        let detailLabel = UILabel()
        detailLabel.text = isTeacher
            ? "This should stay on the iPad."
            : "This should appear only on the projector."
        detailLabel.textAlignment = .center
        detailLabel.numberOfLines = 0
        detailLabel.font = .systemFont(ofSize: 28, weight: .semibold)
        detailLabel.textColor = isTeacher
            ? UIColor(red: 0.18, green: 0.36, blue: 0.38, alpha: 1)
            : UIColor(red: 0.78, green: 0.87, blue: 1, alpha: 1)

        statusLabel.textAlignment = .center
        statusLabel.numberOfLines = 0
        statusLabel.font = .systemFont(ofSize: 20, weight: .bold)
        statusLabel.textColor = isTeacher
            ? UIColor(red: 0.04, green: 0.49, blue: 0.45, alpha: 1)
            : UIColor(red: 0.78, green: 0.87, blue: 1, alpha: 1)

        let stack = UIStackView(arrangedSubviews: [badge, titleLabel, detailLabel, statusLabel])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 24
        view.addSubview(stack)

        NSLayoutConstraint.activate([
            badge.widthAnchor.constraint(equalToConstant: 140),
            badge.heightAnchor.constraint(equalToConstant: 140),
            stack.centerXAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: view.safeAreaLayoutGuide.centerYAnchor),
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 32),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -32),
            titleLabel.widthAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.widthAnchor, multiplier: 0.9),
            detailLabel.widthAnchor.constraint(lessThanOrEqualTo: view.safeAreaLayoutGuide.widthAnchor, multiplier: 0.85)
        ])

        updateConnectionStatus()
    }

    @objc private func updateConnectionStatus() {
        guard role == .teacher else {
            statusLabel.text = "External display scene is active."
            return
        }
        let connected = UIApplication.shared.connectedScenes.contains {
            $0.session.role == .windowExternalDisplayNonInteractive
        }
        statusLabel.text = connected
            ? "Projector detected: separate Student Stage is active."
            : "Connect the projector while this app is open."
    }
}
