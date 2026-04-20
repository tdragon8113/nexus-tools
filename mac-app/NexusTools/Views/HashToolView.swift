import SwiftUI
import CryptoKit

/// Hash 生成工具视图
struct HashToolView: View {
    var initialInput: String = ""
    @State private var input: String = ""
    @State private var outputs: [HashResult] = []
    @State private var selectedAlgorithm: Algorithm = .sha256
    @State private var hasProcessedInitialInput = false

    enum Algorithm: String, CaseIterable {
        case md5 = "MD5"
        case sha256 = "SHA-256"
        case sha384 = "SHA-384"
        case sha512 = "SHA-512"

        var displayName: String { rawValue }
    }

    struct HashResult: Identifiable {
        let id = UUID()
        let algorithm: Algorithm
        let hash: String
    }

    var body: some View {
        VStack(spacing: 12) {
            algorithmSelector
            inputSection
            actionButtons
            outputSection
        }
        .padding(16)
        .onAppear {
            if !initialInput.isEmpty && !hasProcessedInitialInput {
                input = initialInput
                hasProcessedInitialInput = true
                generateAll()
            }
        }
    }

    private var algorithmSelector: some View {
        HStack(spacing: 6) {
            Text("算法:")
                .font(.system(size: 12))
                .foregroundColor(.secondary)

            ForEach(Algorithm.allCases, id: \.self) { algo in
                Button(action: { selectedAlgorithm = algo }) {
                    Text(algo.displayName)
                        .font(.system(size: 11))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 4)
                        .background(selectedAlgorithm == algo ? Color.accentColor : Color.secondary.opacity(0.2))
                        .foregroundColor(selectedAlgorithm == algo ? .white : .primary)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                }
                .buttonStyle(.borderless)
            }

            Spacer()

            Button(action: generateAll) {
                Text("全部生成")
                    .font(.system(size: 11))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
            }
            .buttonStyle(.bordered)
        }
    }

    private var inputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("输入文本")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
            PlainTextEditor(text: $input)
                .frame(height: 100)
                .border(Color.secondary.opacity(0.3), width: 1)
                .cornerRadius(4)
        }
    }

    private var actionButtons: some View {
        HStack(spacing: 12) {
            Button(action: generateHash) {
                Text("生成 Hash")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)

            Button(action: clearAll) {
                Label("清空", systemImage: "trash")
            }
            .buttonStyle(.bordered)
        }
    }

    private var outputSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Hash 结果")
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)

            if outputs.isEmpty {
                Text("点击生成按钮计算 Hash")
                    .font(.system(size: 13))
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                    .padding()
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(4)
            } else {
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(outputs) { result in
                            hashResultRow(result)
                        }
                    }
                }
                .frame(maxHeight: 160)
            }
        }
    }

    private func hashResultRow(_ result: HashResult) -> some View {
        HStack(spacing: 8) {
            Text(result.algorithm.displayName)
                .font(.system(size: 12, weight: .medium))
                .foregroundColor(.secondary)
                .frame(width: 60, alignment: .leading)

            Text(result.hash)
                .font(.system(size: 12))
                .lineLimit(1)
                .truncationMode(.middle)

            Spacer()

            Button(action: { copyHash(result.hash) }) {
                Image(systemName: "doc.on.doc")
                    .font(.system(size: 12))
            }
            .buttonStyle(.borderless)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 6)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(4)
    }

    private func generateHash() {
        guard !input.isEmpty else { return }
        outputs = [HashResult(algorithm: selectedAlgorithm, hash: computeHash(selectedAlgorithm))]
    }

    private func generateAll() {
        guard !input.isEmpty else { return }
        outputs = Algorithm.allCases.map { algo in
            HashResult(algorithm: algo, hash: computeHash(algo))
        }
    }

    private func computeHash(_ algorithm: Algorithm) -> String {
        let data = Data(input.utf8)

        switch algorithm {
        case .md5:
            let hash = Insecure.MD5.hash(data: data)
            return hash.compactMap { String(format: "%02x", $0) }.joined()
        case .sha256:
            let hash = SHA256.hash(data: data)
            return hash.compactMap { String(format: "%02x", $0) }.joined()
        case .sha384:
            let hash = SHA384.hash(data: data)
            return hash.compactMap { String(format: "%02x", $0) }.joined()
        case .sha512:
            let hash = SHA512.hash(data: data)
            return hash.compactMap { String(format: "%02x", $0) }.joined()
        }
    }

    private func copyHash(_ hash: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(hash, forType: .string)
    }

    private func clearAll() {
        input = ""
        outputs = []
    }
}

#Preview {
    HashToolView()
        .frame(width: 400, height: 500)
}