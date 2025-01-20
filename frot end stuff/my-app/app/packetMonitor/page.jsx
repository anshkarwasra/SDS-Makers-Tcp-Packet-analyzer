"use client"
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";

const PayloadViewer = ({ payload, length }) => {
  const [showRaw, setShowRaw] = useState(false);

  if (!length || length === "0") return (
    <Badge variant="secondary">No payload</Badge>
  );

  const formattedPayload = payload?.replace(/.{2}/g, '$& ').trim();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md text-sm transition-colors">
          <Eye size={14} />
          <span>{length} bytes</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Packet Payload</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline">{length} bytes</Badge>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              {showRaw ? <EyeOff size={14} /> : <Eye size={14} />}
              {showRaw ? "Show Formatted" : "Show Raw"}
            </button>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm overflow-auto max-h-[50vh]">
            {showRaw ? (
              <div className="whitespace-pre-wrap break-all">{payload}</div>
            ) : (
              <div className="grid grid-cols-16 gap-x-2 gap-y-1">
                {formattedPayload?.split(' ').map((byte, index) => (
                  <span 
                    key={index}
                    className="text-center hover:bg-blue-100 rounded px-1 transition-colors"
                    title={`Byte ${index}`}
                  >
                    {byte}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Page = () => {
  const [packets, setPackets] = useState([]);
  const [filter, setFilter] = useState("");
  
  useEffect(() => {
    const storedData = localStorage.getItem('packets');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setPackets(parsedData);
      localStorage.removeItem('packets');
    }
  }, []);

  const filteredPackets = packets.filter(packet => 
    packet.source.ip.includes(filter) ||
    packet.destination.ip.includes(filter) ||
    packet.source.city.toLowerCase().includes(filter.toLowerCase()) ||
    packet.destination.city.toLowerCase().includes(filter.toLowerCase())
  );

  if (!packets.length) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="text-gray-600">Loading packets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Network Packet Monitor</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Filter packets..."
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Badge variant="secondary">
            {filteredPackets.length} packets
          </Badge>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow">
        <div className="graphContainer overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Source</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Destination</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Protocol</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Flags</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPackets.map((packet, index) => (
                <tr 
                  key={`packet-${index}`}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(packet.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{packet.source.ip}</div>
                    <div className="text-sm text-gray-500">{packet.source.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{packet.destination.ip}</div>
                    <div className="text-sm text-gray-500">{packet.destination.city}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{packet.protocol}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">{packet.flags || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PayloadViewer payload={packet.payload} length={packet.length} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Page;