import { describe, expect, it } from "vitest";
import { inCidr } from "./ingress.js";

describe("edge peer boundary", () => {
  it("accepts dynamic IPs inside the edge subnet, including mapped IPv4", () => {
    expect(inCidr("172.31.11.42", "172.31.11.0/24")).toBe(true);
    expect(inCidr("::ffff:172.31.11.42", "172.31.11.0/24")).toBe(true);
  });
  it("rejects other networks and malformed addresses", () => {
    expect(inCidr("172.31.12.42", "172.31.11.0/24")).toBe(false);
    expect(inCidr("127.0.0.1", "172.31.11.0/24")).toBe(false);
    expect(inCidr("garbage", "172.31.11.0/24")).toBe(false);
  });
});
