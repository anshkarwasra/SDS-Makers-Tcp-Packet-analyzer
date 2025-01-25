from flask import Flask, request, Response
from flask_cors import CORS
import json
from reciever import start_capture
from datetime import datetime
import threading
import time
from ip_to_geolocation import IpToGeographicalData
from scapy.all import conf

app = Flask(__name__)
CORS(app)

# Global packet store and counter
packet_store = []
packets_sent = 0
MAX_PACKETS =100
capture_thread = None
networkInterface = "Wi-Fi"

def run_capture():
    """Run packet capture in a separate thread"""
    try:
        print('started capturing on :',networkInterface)
        captured_packets = start_capture(depArr=packet_store)
    except KeyboardInterrupt:
        print("Capture stopped by user")
    except Exception as e:
        print(f"Capture stopped due to error: {e}")

def serialize_packet(packet):
    """Convert packet to JSON serializable format"""
    geoDataSrc = IpToGeographicalData(str(packet.get('src_ip', '')))
    geoDataDst = IpToGeographicalData(str(packet.get('dst_ip', '')))
    return {
        'timestamp': str(packet.get('timestamp', '')),
        'source': geoDataSrc,
        'destination': geoDataDst,
        'protocol': "TCP",
        'length': str(packet.get('payload_length', '')),
        'flags' : str(packet.get('flags','')),
        'payload': str(packet.get('payload')),
        'DNS query': str(packet.get('DNS query')),
        'DNS response': str(packet.get('DNS response'))
    }

@app.route('/stream-packets',methods=['GET','POST'])
def stream_packets():
    """SSE endpoint for streaming packet updates (limited to 10 packets)"""
    global capture_thread, packets_sent,networkInterface
    
    # Reset packets_sent counter for new connection
    packets_sent = 0
    
    # Start capture thread if not already running
    if capture_thread is None or not capture_thread.is_alive():
        capture_thread = threading.Thread(target=run_capture)
        capture_thread.daemon = True
        capture_thread.start()
    
    def generate():
        global packets_sent
        last_count = 0
        
        while packets_sent < MAX_PACKETS:
            current_count = len(packet_store)
            if current_count > last_count:
                # Get only new packets
                new_packets = packet_store[last_count:current_count]
                try:
                    # Convert packets to serializable format
                    serialized_packets = [serialize_packet(p) for p in new_packets]
                    
                    # Limit packets to remaining count
                    remaining = MAX_PACKETS - packets_sent
                    serialized_packets = serialized_packets[:remaining]
                    
                    data = {
                        'packets': serialized_packets,
                        'count': len(serialized_packets),
                        'interface': 'Wi-Fi',
                        'timestamp': datetime.now().isoformat(),
                        'client_ip': 'localhost',
                        'packets_remaining': MAX_PACKETS - (packets_sent + len(serialized_packets))
                    }
                    
                    packets_sent += len(serialized_packets)
                    last_count = last_count + len(serialized_packets)
                    
                    yield f"data: {json.dumps(data)}\n\n"
                    
                    # If we've sent all packets, send completion message and close connection
                    if packets_sent >= MAX_PACKETS:
                        final_data = {
                            'status': 'complete',
                            'total_packets_sent': packets_sent,
                            'timestamp': datetime.now().isoformat(),
                            'connection': 'closing'
                        }
                        yield f"data: {json.dumps(final_data)}\n\n"
                        break
                        
                except Exception as e:
                    print(f"Error serializing packets: {e}")
            time.sleep(1)
       
        return

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET'
        }
    )

@app.route('/stop-capture')
def stop_capture():
    """Endpoint to stop packet capture"""
    global capture_thread, packet_store
    if capture_thread and capture_thread.is_alive():
        try:
            serialized_packets = [serialize_packet(p) for p in packet_store[:MAX_PACKETS]]
            capture_thread.join(timeout=1)
            return {
                'status': 'capture stopped',
                'packets': serialized_packets
            }
        except Exception as e:
            return {'status': f'error during stop: {str(e)}'}
    return {'status': 'no capture running'}

@app.route('/get-available-network-interfaces')
def getInterfaces():
    ifaces_dict = {}
    for iface in conf.ifaces:
        iface_data = conf.ifaces[iface].__dict__

        # Filter out non-serializable objects
        cleaned_data = {k: str(v) for k, v in iface_data.items() if not k.startswith('_')}
        ifaces_dict[iface] = cleaned_data
    availableInterfaces = []    
    for _,value in ifaces_dict.items():
        availableInterfaces.append(value["name"])
    return {
        "status":"success",
        "interfaces":availableInterfaces,
    }



if __name__ == '__main__':
    app.run(debug=True, threaded=True)