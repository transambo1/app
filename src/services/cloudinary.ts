export async function uploadToCloudinary(uri: string) {
    const data = new FormData();

    data.append("file", {
        uri: uri,
        type: "image/jpeg",
        name: "photo.jpg",
    } as any);

    data.append("upload_preset", "social");

    try {
        const res = await fetch(
            "https://api.cloudinary.com/v1_1/dmmpgjbcb/image/upload",
            {
                method: "POST",
                body: data,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        const result = await res.json();

        if (result.error) {
            console.error("Cloudinary Error:", result.error.message);
            return null;
        }

        return result.secure_url;
    } catch (error) {
        console.error("Network Error:", error);
        return null;
    }
}