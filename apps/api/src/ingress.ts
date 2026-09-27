import ipaddr from "ipaddr.js";

export function inCidr(address: string, cidr: string): boolean {
  try {
    const [network, prefix] = ipaddr.parseCIDR(cidr);
    let peer = ipaddr.parse(address);
    if (peer.kind() === "ipv6" && (peer as ipaddr.IPv6).isIPv4MappedAddress()) peer = (peer as ipaddr.IPv6).toIPv4Address();
    return peer.kind() === network.kind() && peer.match(network, prefix);
  } catch { return false; }
}
