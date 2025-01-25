
import React, { useLayoutEffect, useState } from "react";

const WorldMapArcs = ({ cityCords, connections,packets }) => {
  const [dimensions, setDimensions] = useState(null);
  const [TrafficObject, setTrafficObject] = useState({})
  const isEven = (num) => num % 2 === 0;

  // Convert coordinates to numbers
  const formattedCityCords = React.useMemo(() => {
    return Object.entries(cityCords).reduce((acc, [city, coords]) => {
      acc[city] = {
        lat: Number(coords.lat),
        lng: Number(coords.lng),
      };
      return acc;
    }, {});
  }, [cityCords]);

  // Create a set of unique cities
  const uniqueCities = React.useMemo(() => {
    const cities = new Set();
    connections.forEach((conn) => {
      cities.add(conn.from);
      cities.add(conn.to);
    });
    return Array.from(cities);
  }, [connections]);

  useLayoutEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    function countConnections(cityName) {
      return packets.reduce((count, connection) => {
        if (connection.destination.city === cityName) {
          count++;
        }
        return count;
      }, 0);
    }
    uniqueCities.forEach((eli) => {
      setTrafficObject((prev) => ({ ...prev, [eli]: countConnections(eli) }));
    });
    

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const projectCoordinates = (lat, lng) => {
    const mapWidth = dimensions?.width || 0;
    const mapHeight = dimensions?.height || 0;

    const x = (lng + 180) * (mapWidth / 360);

    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = mapHeight / 2 - (mapWidth * mercN) / (2 * Math.PI);

    return { x, y };
  };

  const createArcPath = (startLat, startLng, endLat, endLng) => {
    const start = projectCoordinates(startLat, startLng);
    const end = projectCoordinates(endLat, endLng);

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    const curveHeight = distance * 0.15;

    const controlY = midY - curveHeight;

    return `M ${start.x},${start.y} Q ${midX},${controlY} ${end.x},${end.y}`;
  };

  const getLabelPosition = (point, index, totalCities) => {
    const baseOffset = 15;
    // Distribute labels evenly around the point based on total unique cities
    const angle = (index * (2 * Math.PI)) / totalCities;
    const offset = {
      x: Math.cos(angle) * baseOffset,
      y: Math.sin(angle) * baseOffset,
    };

    return {
      x: point.x + offset.x,
      y: point.y + offset.y,
    };
  };

  if (!dimensions) {
    return <div className="relative w-full h-screen">Loading...</div>;
  }

  return (
    <div className="relative w-full h-screen">
      <div className="absolute inset-0">
        <img
          src="/mapwrapper.jpg"
          alt="World Map"
          className="w-full h-full object-cover"
        />
      </div>

      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ pointerEvents: "none" }}
      >
        {/* Render connection arcs */}
        {connections.map((connection, index) => {
          const fromCity = formattedCityCords[connection.from];
          const toCity = formattedCityCords[connection.to];
      
          if (!fromCity || !toCity) {
            console.warn(
              "Missing city:",
              !fromCity ? connection.from : connection.to
            );
            return null;
          }
          let clrTOfill = 'green';
          if (TrafficObject[connection.from] > 7){
            clrTOfill = 'red'
          }
          else if (TrafficObject[connection.from] > 4){
            clrTOfill = 'yellow'
          }
          console.log(TrafficObject)
        
          return (

            <>
            <path
              key={`connection-${index}`}
              d={createArcPath(
                fromCity.lat,
                fromCity.lng,
                toCity.lat,
                toCity.lng
              )}
              fill="none"
              stroke="rgba(0, 255, 255, 0.1)"
              strokeWidth="2"
              className="animate-pulse"
            />
              <circle key={`connection-${index+30}`} id="packet" r="5" fill={clrTOfill}>
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                rotate="auto"
                path={
                  createArcPath(
                        fromCity.lat,
                        fromCity.lng,
                        toCity.lat,
                        toCity.lng
                      )
                }
              />
            </circle>
            </>
          );
        })}

        {/* Render unique city points and labels */}
        {uniqueCities.map((cityName, index) => {
          const city = formattedCityCords[cityName];
          if (!city) return null;

          const coords = projectCoordinates(city.lat, city.lng);
          const labelCoords = getLabelPosition(
            coords,
            index,
            uniqueCities.length
          );

          return (
            <g key={`city-${cityName}`}>
              {/* City Point */}
              <circle cx={coords.x} cy={coords.y} r="4" fill="#00ffff" />
              {/* Solid circle underneath */}
              <circle cx={coords.x} cy={coords.y} r="3" fill="#00ffff" />
              {/* City Label */}
              <text
                x={labelCoords.x}
                y={labelCoords.y - 10}
                fill="white"
                fontSize="12"
                textAnchor="middle"
                className="text-sm font-medium drop-shadow-lg"
                style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
              >
                {cityName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default WorldMapArcs;
