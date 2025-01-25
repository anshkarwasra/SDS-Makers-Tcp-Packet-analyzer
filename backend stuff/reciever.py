from scapy.all import *
from datetime import datetime
from ip_to_geolocation import IpToGeographicalData
# Global list to store captured packet data


def packet_callback(packet,dependecyArray,interface):
    """Process each captured packet and store in global list"""
    try:
        print(f'found packet: {packet}')
        if IP in packet and TCP in packet:

            packet_info = {
                'timestamp': datetime.fromtimestamp(packet.time).strftime('%Y-%m-%d %H:%M:%S'),
                'src_ip': packet[IP].src,
                'dst_ip': packet[IP].dst,
                'src_port': packet[TCP].sport,
                'dst_port': packet[TCP].dport,
                'flags': str(packet[TCP].flags),
                'payload_length': 0,
                'payload' : {}
           
            }
            
            if Raw in packet:
                packet_info['payload_length'] = len(packet[Raw].load)
                packet_info['payload'] = packet[Raw].load
           
          
            dependecyArray.append(packet_info)
        
            
    except Exception as e:
        print(f"Error processing packet: {e}")

def start_capture(depArr,interface=None, filter="tcp", count=0):
    """
    Start capturing packets
    
    Args:
    interface (str): Network interface to capture from
    filter (str): BPF filter string
    count (int): Number of packets to capture (0 for infinite)
    """
    try:
        if interface is None:
            print('the interface u provided was none')
            interface = conf.iface
            
        print(f"Starting capture on {interface}")
        print(f"Filter: {filter}")
        print(f"Press Ctrl+C to stop...")
        
        
        callback = lambda x: packet_callback(x,depArr,interface)
        output = sniff(iface=interface,
              filter=filter,
              prn=callback,
              count=count,
              store=0)
        
        print(f"\nCapture complete. {len(captured_packets)} packets stored.")
        
    except KeyboardInterrupt:
        print(f"\nCapture stopped by user. {len(captured_packets)} packets stored.")
    except Exception as e:
        print(f"\nError: {e}")
    
    return depArr

if __name__ == "__main__":
    depArr = []
    packets = start_capture(filter="tcp",depArr=depArr)
  