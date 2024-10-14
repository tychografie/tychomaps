export async function getUserLocation(): Promise<{
  latitude: number;
  longitude: number;
  address: string;
  country: string;
} | undefined> {

  if (window.navigator.geolocation) {
    window.navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const response = await fetch(`/api/locate?latitude=${latitude}&longitude=${longitude}`);
        if (response.ok) {
          const data = await response.json();
          const { address, country } = data;
          return {
            latitude,
            longitude,
            address,
            country,
          }
        } else {
          throw new Error('Error occurred while getting location');
        }
      } catch (error) {
        console.error('Error:', error);
        window.alert((error as { message: string })?.message);
      }
    }, (error) => {
      console.error('Geolocation error:', error);
      window.alert('Error occurred while getting location');
    });
  } else {
    window.alert('Geolocation is not supported by this browser.');
  }
}