from scapy.all import sniff, DNS, TCP, UDP, Raw
from scapy.layers.dns import DNS, DNSQR, DNSRR
import traceback
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s: %(message)s')

def analyze_packet(packet):
    try:
        if packet.haslayer(DNS):
            analyze_dns(packet)
    except Exception as e:
        logging.error(f"Packet analysis error: {e}")
        logging.error(traceback.format_exc())

def analyze_dns(packet):
    try:
        if DNS in packet:
            if packet[DNS].qr == 0:  # Query
                qname = packet[DNSQR].qname.decode() if DNSQR in packet else "Unknown"
                logging.info(f"DNS Query: {qname}")
            elif packet[DNS].qr == 1:  # Response
                qname = packet[DNSQR].qname.decode() if DNSQR in packet else "Unknown"
                rdata = packet[DNSRR].rdata if DNSRR in packet else "Unknown"
                logging.info(f"DNS Response: {qname} -> {rdata}")
    except Exception as e:
        logging.error(f"DNS parsing error: {e}")
        logging.error(traceback.format_exc())

def analyze_http(packet):
    try:
        if packet.haslayer(Raw):
            raw_data = packet[Raw].load
            try:
                decoded_data = raw_data.decode()
                logging.info("HTTP Data:")
                logging.info(decoded_data)
            except UnicodeDecodeError:
                logging.warning("Could not decode raw data")
    except Exception as e:
        logging.error(f"HTTP analysis error: {e}")
        logging.error(traceback.format_exc())

# Start sniffing all packets with error handling
try:
    logging.info("Starting packet sniffing...")
    sniff(prn=analyze_packet, store=0)
except Exception as e:
    logging.critical(f"Sniffing terminated with error: {e}")
    logging.critical(traceback.format_exc())