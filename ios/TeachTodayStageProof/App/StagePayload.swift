import Foundation
import CoreGraphics

enum StagePayloadSanitizer {
    private static let allowedModes: Set<String> = [
        "private", "poster", "cards", "hfw", "sentence", "chart",
        "sounds", "journal", "dictation-paper", "passage", "game"
    ]

    static let privatePayload: [String: Any] = [
        "mode": "private",
        "displayMode": "private",
        "groupName": "Teach Today",
        "privacyTitle": "Private teacher work",
        "privacyMessage": "Keep reading, writing, or practicing while your teacher works."
    ]

    static func sanitize(_ body: Any) -> [String: Any]? {
        guard let source = body as? [String: Any] else { return nil }
        let requestedMode = string(source["mode"], maxLength: 32)
        let mode = allowedModes.contains(requestedMode) ? requestedMode : "private"

        var output = privatePayload
        output["mode"] = mode
        output["displayMode"] = string(source["displayMode"], maxLength: 32)
        output["sourceSection"] = string(source["sourceSection"], maxLength: 32)
        output["sectionLabel"] = string(source["sectionLabel"], maxLength: 64)
        output["updatedAt"] = string(source["updatedAt"], maxLength: 64)
        output["lessonId"] = string(source["lessonId"], maxLength: 128)
        output["substep"] = string(source["substep"], maxLength: 32)
        output["skillTitle"] = string(source["skillTitle"], maxLength: 160)
        output["groupName"] = "Teach Today"

        output["poster"] = dictionary(source["poster"]) { poster in
            compact([
                "src": safeRelativePath(poster["src"]),
                "label": string(poster["label"], maxLength: 64)
            ])
        }
        output["cardDisplay"] = dictionary(source["cardDisplay"]) { card in
            compact([
                "kind": string(card["kind"], maxLength: 32),
                "variant": string(card["variant"], maxLength: 32),
                "layout": string(card["layout"], maxLength: 32),
                "key": string(card["key"], maxLength: 180),
                "sectionLabel": string(card["sectionLabel"], maxLength: 64),
                "headline": string(card["headline"], maxLength: 180),
                "subhead": string(card["subhead"], maxLength: 300),
                "word": string(card["word"], maxLength: 120),
                "wordNote": string(card["wordNote"], maxLength: 200),
                "label": string(card["label"], maxLength: 120),
                "position": string(card["position"], maxLength: 64),
                "items": dictionaries(card["items"], limit: 16) { item in
                    compact([
                        "text": string(item["text"], maxLength: 80),
                        "type": string(item["type"], maxLength: 32),
                        "keyword": string(item["keyword"], maxLength: 80),
                        "imageKey": string(item["imageKey"], maxLength: 16),
                        "pair": string(item["pair"], maxLength: 16),
                        "tap": number(item["tap"]),
                        "mark": string(item["mark"], maxLength: 40)
                    ])
                }
            ])
        }
        output["highFrequencyWords"] = strings(source["highFrequencyWords"], limit: 16, maxLength: 80)
        output["sentence"] = string(source["sentence"], maxLength: 600)
        output["notebookSentence"] = string(source["notebookSentence"], maxLength: 300)
        output["chart"] = dictionary(source["chart"]) { chart in
            compact([
                "key": string(chart["key"], maxLength: 180),
                "title": string(chart["title"], maxLength: 120),
                "reader": number(chart["reader"]),
                "page": number(chart["page"]),
                "level": string(chart["level"], maxLength: 24),
                "activeHalf": string(chart["activeHalf"], maxLength: 16),
                "topWords": strings(chart["topWords"], limit: 15, maxLength: 80),
                "bottomWords": strings(chart["bottomWords"], limit: 15, maxLength: 80)
            ])
        }
        output["soundReference"] = dictionary(source["soundReference"]) { reference in
            compact([
                "key": string(reference["key"], maxLength: 180),
                "groups": dictionaries(reference["groups"], limit: 8) { group in
                    compact([
                        "title": string(group["title"], maxLength: 100),
                        "items": strings(group["items"], limit: 36, maxLength: 40)
                    ])
                }
            ])
        }
        output["journal"] = promptPayload(source["journal"])
        output["dictationPaper"] = promptPayload(source["dictationPaper"])
        output["passageTitle"] = string(source["passageTitle"], maxLength: 240)
        output["passageText"] = string(source["passageText"], maxLength: 12_000)
        output["passagePdf"] = dictionary(source["passagePdf"]) { pdf in
            compact([
                "passageId": string(pdf["passageId"], maxLength: 180),
                "reader": number(pdf["reader"]),
                "readerPageStart": number(pdf["readerPageStart"]),
                "pdfPageStart": number(pdf["pdfPageStart"]),
                "pdfPageEnd": number(pdf["pdfPageEnd"]),
                "pdfPath": safeRelativePath(pdf["pdfPath"])
            ])
        }
        output["gameUrl"] = safeRelativePath(source["gameUrl"])
        output["privacyTitle"] = string(source["privacyTitle"], maxLength: 160)
        output["privacyMessage"] = string(source["privacyMessage"], maxLength: 300)

        return output
    }

    private static func promptPayload(_ value: Any?) -> [String: Any]? {
        dictionary(value) { item in
            compact([
                "key": string(item["key"], maxLength: 180),
                "prompt": string(item["prompt"], maxLength: 300)
            ])
        }
    }

    private static func safeRelativePath(_ value: Any?) -> String? {
        let path = string(value, maxLength: 600)
        let decodedPath = path.removingPercentEncoding ?? path
        let pathComponents = decodedPath.replacingOccurrences(of: "\\", with: "/").split(separator: "/")
        guard !path.isEmpty,
              !path.hasPrefix("/"),
              !path.hasPrefix("//"),
              URL(string: path)?.scheme == nil,
              !pathComponents.contains("..")
        else { return nil }
        return path
    }

    private static func string(_ value: Any?, maxLength: Int) -> String {
        guard let value = value as? String else { return "" }
        return String(value.prefix(maxLength))
    }

    private static func number(_ value: Any?) -> NSNumber? {
        value as? NSNumber
    }

    private static func strings(_ value: Any?, limit: Int, maxLength: Int) -> [String] {
        guard let values = value as? [Any] else { return [] }
        return values.prefix(limit).compactMap { item in
            let value = string(item, maxLength: maxLength)
            return value.isEmpty ? nil : value
        }
    }

    private static func dictionary(
        _ value: Any?,
        transform: ([String: Any]) -> [String: Any]
    ) -> [String: Any]? {
        guard let value = value as? [String: Any] else { return nil }
        return transform(value)
    }

    private static func dictionaries(
        _ value: Any?,
        limit: Int,
        transform: ([String: Any]) -> [String: Any]
    ) -> [[String: Any]] {
        guard let values = value as? [Any] else { return [] }
        return values.prefix(limit).compactMap { item in
            guard let item = item as? [String: Any] else { return nil }
            return transform(item)
        }
    }

    private static func compact(_ dictionary: [String: Any?]) -> [String: Any] {
        dictionary.reduce(into: [:]) { result, entry in
            guard let value = entry.value else { return }
            result[entry.key] = value
        }
    }
}

@MainActor
protocol StagePayloadReceiver: AnyObject {
    func displayStagePayload(_ payload: [String: Any])
    func setProjectionMode(_ mode: ExternalProjectionMode)
    func displayTeacherSnapshot(_ image: CGImage)
}

enum ExternalProjectionMode {
    case stage
    case mirror
}

@MainActor
final class StageCoordinator {
    static let shared = StageCoordinator()

    private(set) var latestPayload = StagePayloadSanitizer.privatePayload
    private(set) var projectionMode = ExternalProjectionMode.stage
    private weak var receiver: StagePayloadReceiver?

    private init() {}

    func receive(_ body: Any) {
        guard let payload = StagePayloadSanitizer.sanitize(body) else { return }
        latestPayload = payload
        if projectionMode == .stage {
            receiver?.displayStagePayload(payload)
        }
    }

    func setProjectionMode(_ mode: ExternalProjectionMode) {
        projectionMode = mode
        receiver?.setProjectionMode(mode)
        if mode == .stage {
            receiver?.displayStagePayload(latestPayload)
        }
    }

    func displayTeacherSnapshot(_ image: CGImage) {
        guard projectionMode == .mirror else { return }
        receiver?.displayTeacherSnapshot(image)
    }

    func attach(_ receiver: StagePayloadReceiver) {
        self.receiver = receiver
        receiver.setProjectionMode(projectionMode)
        if projectionMode == .stage {
            receiver.displayStagePayload(latestPayload)
        }
    }

    func detach(_ receiver: StagePayloadReceiver) {
        guard self.receiver === receiver else { return }
        self.receiver = nil
    }
}
