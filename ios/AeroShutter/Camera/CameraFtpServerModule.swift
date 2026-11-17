import Foundation
import Network

@objc(CameraFtpServerModule)
class CameraFtpServerModule: RCTEventEmitter {
  private var listener: NWListener?
  private var isRunning: Bool = false
  private var port: UInt16 = 2121

  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  override func supportedEvents() -> [String]! {
    return ["FTP_PHOTO_UPLOADED"]
  }

  @objc(startServer:resolver:rejecter:)
  func startServer(port: NSNumber, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    self.port = port.uint16Value

    do {
      let tcpOptions = NWProtocolTCP.Options()
      let params = NWParameters(tls: nil, tcp: tcpOptions)
      params.allowLocalEndpointReuse = true

      guard let nwPort = NWEndpoint.Port(rawValue: self.port) else {
        reject("INVALID_PORT", "Invalid port number", nil)
        return
      }

      let listener = try NWListener(using: params, on: nwPort)
      self.listener = listener

      listener.stateUpdateHandler = { state in
        switch state {
        case .ready:
          self.isRunning = true
        case .failed(let error):
          self.isRunning = false
        default:
          break
        }
      }

      listener.newConnectionHandler = { connection in
        self.handleNewConnection(connection)
      }

      listener.start(queue: .global(qos: .userInitiated))
      self.isRunning = true

      resolve([
        "isRunning": true,
        "ipAddress": self.getWiFiAddress() ?? "172.20.10.1",
        "port": self.port
      ])
    } catch {
      reject("FTP_START_ERROR", error.localizedDescription, error)
    }
  }

  @objc(stopServer:rejecter:)
  func stopServer(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    listener?.cancel()
    listener = nil
    isRunning = false
    resolve(true)
  }

  private func handleNewConnection(_ connection: NWConnection) {
    connection.start(queue: .global(qos: .userInitiated))
    // FTP Greeting
    let welcome = "220 AeroShutter iOS Camera FTP Ready\r\n"
    if let data = welcome.data(using: .utf8) {
      connection.send(content: data, completion: .contentProcessed({ _ in }))
    }
  }

  private func getWiFiAddress() -> String? {
    var address: String?
    var ifaddr: UnsafeMutablePointer<ifaddrs>?
    guard getifaddrs(&ifaddr) == 0 else { return nil }
    guard let firstAddr = ifaddr else { return nil }

    for ifptr in sequence(first: firstAddr, next: { $0.pointee.ifa_next }) {
      let interface = ifptr.pointee
      let addrFamily = interface.ifa_addr.pointee.sa_family
      if addrFamily == UInt8(AF_INET) {
        let name = String(cString: interface.ifa_name)
        if name == "en0" || name == "bridge100" { // en0 is Wi-Fi, bridge100 is Personal Hotspot
          var hostname = [CChar](repeating: 0, count: Int(NI_MAXHOST))
          getnameinfo(interface.ifa_addr, socklen_t(interface.ifa_addr.pointee.sa_len),
                      &hostname, socklen_t(hostname.count),
                      nil, socklen_t(0), NI_NUMERICHOST)
          address = String(cString: hostname)
        }
      }
    }
    freeifaddrs(ifaddr)
    return address
  }
}

