'use client'
import { useEffect, useRef } from 'react';
import { useMap } from '../hooks/useMap';
import { Route } from '../utils/model';
import { socket } from '../utils/socket-io';

export function AdminPage() {

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useMap(mapContainerRef);  
  useEffect(() =>{
    socket.connect();

    socket.on("admin-new-points",
    async (data: { route_id:string; lat: number; lng: number }) =>{
      if(!map?.hasRoute(data.route_id)){
        const response = await fetch(`http://localhost:3001/api/routes/${data.route_id}`);
        const route: Route = await response.json();
        map?.removeRoute(data.route_id);

        await map?.addRouteWithIcons({
          routeId: data.route_id,
          startMarkerOptions:{
            position: route.directions.routes[0].legs[0].start_location,
          },
          endMarkerOptions:{
            position: route.directions.routes[0].legs[0].end_location,
          },
          carMarkerOptions:{
            position: route.directions.routes[0].legs[0].start_location,
          }
        });
      }
      map?.moveCar(data.route_id,{
        lat: data.lat,
        lng: data.lng
      }); 
    });
    return() =>{
      socket.disconnect();
    }
  }, [map]);

  useEffect(() =>{

  },[])
  async function startRoute(){
    const routeId = (document.getElementById('route') as HTMLSelectElement).value;
    const routeResponse = await fetch(`http://localhost:3001/api/routes/${routeId}`);
    const route:Route = await routeResponse.json();

    map?.removeAllRoutes();
    
    await map?.addRouteWithIcons({
      routeId:routeId,
      startMarkerOptions:{
        position: route.directions.routes[0].legs[0].start_location,
      },
      endMarkerOptions:{
        position: route.directions.routes[0].legs[0].end_location,
      },
      carMarkerOptions:{
        position: route.directions.routes[0].legs[0].start_location,
      }
    });

    const {steps} = route.directions.routes[0].legs[0];

    for(const step of steps){
        await sleep(2000);
        map?.moveCar(routeId, step.start_location);
        socket.emit('new-points'),{
          route_id: routeId,
          lat: step.start_location.lat,
          lng: step.start_location.lng,
        };

        await sleep(2000);
        map?.moveCar(routeId, step.end_location);
        socket.emit('new-points'),{
          route_id: routeId,
          lat: step.end_location.lat,
          lng: step.end_location.lng,
        };
    }

  }


  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%' }}>   
      <div style={{height: '100%', width: '100%' }} id="map" ref={mapContainerRef}></div>
    </div>
  );
}

export default AdminPage;

const sleep= (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));