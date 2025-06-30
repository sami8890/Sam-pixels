// API route to upload images to Cloudinary
export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'sampixel_uploads'); // You'll need to create this preset in Cloudinary
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return data.secure_url;
}

// Mock API endpoint for development
export const mockUploadImage = async (file: File): Promise<{ publicUrl: string }> => {
  // Simulate upload delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Create a mock URL using FileReader for development
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({ publicUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  });
};