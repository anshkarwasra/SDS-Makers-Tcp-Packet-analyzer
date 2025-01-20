"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";


const WorldMapArcs = dynamic(() => import("./components/Arc"), {
  ssr: false,
});


const SSE_URL = "http://localhost:5000/stream-packets";
const STOP_CAPTURE_URL = "http://localhost:5000/stop-capture";



const Page = () => {
  const Router = useRouter();
  const [packets, setPackets] = useState([]);
  const [isCapturing, setIsCapturing] = useState(true);
  const [status, setStatus] = useState("Starting capture...");
  const [isLoading, setIsLoading] = useState(true);
  const [cityData, setCityData] = useState({
    latitudeLongitude: {}, // Changed from Map to regular object
    connections: [],
  });
  const [ToggleMenu, setToggleMenu] = useState(0)
  const checkForDash = (source, destination) => {
    //change local ip to the local geolocation
    if (source.city === "-") {
      source.city = "Roorkee";
      source.latitude = "29.8529";
      source.longitude = "77.8754";
    }
    if (destination.city === "-") {
      destination.city = "Roorkee";
      destination.latitude = "29.8529";
      destination.longitude = "77.8754";
    }
    return {
      source: source,
      destination: destination,
    };
  };

  

  const processPackets = useCallback((newPackets) => {
    const uniqueCities = {}; // Changed to regular object
    const newConnections = [];

    newPackets.forEach((packet) => {
    
      packet = checkForDash(packet.source, packet.destination);
      const { source: srcGeoData, destination: destGeoData } = packet;

      if (!uniqueCities[srcGeoData.city]) {
        uniqueCities[srcGeoData.city] = {
          lat: srcGeoData.latitude,
          lng: srcGeoData.longitude,
        };
      }

      if (!uniqueCities[destGeoData.city]) {
        uniqueCities[destGeoData.city] = {
          lat: destGeoData.latitude,
          lng: destGeoData.longitude,
        };
      }

      const rawConnection = {
        from: srcGeoData.city,
        to: destGeoData.city,
      };

      if (
        !newConnections.some(
          (c) => c.from === rawConnection.from && c.to === rawConnection.to
        )
      ) {
        newConnections.push(rawConnection);
      }
    });

    setCityData((prev) => ({
      latitudeLongitude: { ...prev.latitudeLongitude, ...uniqueCities },
      connections: [...prev.connections, ...newConnections],
    }));
  }, []);

  useEffect(() => {
    let eventSource;
    let totalPacketCount = 0;
    
    const handleSSEMessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.packets) {
        setPackets((prev) => [...prev, ...data.packets]);
        processPackets(data.packets);
        totalPacketCount += Number(data.packets.length);
        setStatus(`Captured ${totalPacketCount}  packets on ${data.interface}`);
        setIsLoading(false);
      }
      if (data.status === "complete") {
        eventSource.close();
      }
    };

    const startCapture = () => {
      eventSource = new EventSource(SSE_URL, {
        withCredentials: false,
      });
      eventSource.onmessage = handleSSEMessage;
      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        setStatus("Connection error. Retrying...");
        if (!isCapturing) {
          eventSource.close();
        }
      };
    };

    if (isCapturing) {
      startCapture();
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [isCapturing, processPackets]);

  const handleMenuState = ()=>{
    if(ToggleMenu==20){
      setToggleMenu(0)
    }
    else{
      setToggleMenu(20)
    }
  }
  

  


  // Show loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-screen flex items-center justify-center">
       
        <p className="text-lg">Loading packet data...</p>
      </div>
    );
  }
  
  
 
  return (
    <div>
  
      <div className="absolute top-4 left-4 z-10  p-2 rounded  cursor-pointer">
        
        <div className="dropDown flex items-center justify-center flex-col">
          <div className="header flex items-center shadow bg-white/80 w-full justify-center">
            <h2>
              {status}
              </h2>
              <button onClick={handleMenuState} className="mt-2">
                <lord-icon
                  src="https://cdn.lordicon.com/xcrjfuzb.json"
                  trigger="hover"
               
                ></lord-icon>
              </button>
          </div>
          <div className="menu overflow-hidden flex flex-col items-center justify-center bg-white/80" style={{
            "height":`${ToggleMenu}px`,
            "transition": "0.5s all ease",
            "width": `${100}%`,
          }}>
            
            <button onClick={
              ()=>{
                localStorage.setItem('packets',JSON.stringify(packets));
                Router.push('/packetMonitor')
              }
            } className="border-b-2 border-bottom-black w-full p-4">view packets</button>
          </div>
        </div>
      </div>
      <WorldMapArcs
        connections={cityData.connections}
        cityCords={cityData.latitudeLongitude}
      />
    </div>
  );
};

export default Page;
