import os from "os"

export const getIPv4Address = () => {
    const networkInterfaces = os.networkInterfaces();
  
    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName] || [];
  
      for (const iface of interfaces) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  
    return '';
  }