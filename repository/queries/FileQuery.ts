import { supabase } from "@/constants/supabase";

export class FileQuery {

    /**
     * Fetch all files from a specific person's folder in the id-uploads bucket
     * @param personUuid - The UUID of the person's folder under person/
     * @returns Array of file objects with their public URLs
     */
    async FetchPersonIdFiles(personUuid: string) {
        try {
            const folderPath = `person/${personUuid}`;
            
            // List all files in the person's folder
            const { data: files, error } = await supabase.storage
                .from('id-uploads')
                .list(folderPath, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' }
                });

            if (error) {
                console.error('Error fetching person ID files:', error);
                throw error;
            }

            if (!files || files.length === 0) {
                return [];
            }

            // Map files to include their public URLs
            const filesWithUrls = files.map(file => {
                const filePath = `${folderPath}/${file.name}`;
                const { data } = supabase.storage
                    .from('id-uploads')
                    .getPublicUrl(filePath);

                return {
                    name: file.name,
                    path: filePath,
                    publicUrl: data.publicUrl,
                    createdAt: file.created_at,
                    updatedAt: file.updated_at,
                    size: file.metadata?.size
                };
            });

            return filesWithUrls;
        } catch (error) {
            console.error('FetchPersonIdFiles exception:', error);
            throw error;
        }
    }

    /**
     * Fetch a specific file (back.jpg, front.jpg, or selfie.jpg) from a person's folder
     * @param personUuid - The UUID of the person's folder
     * @param fileName - The name of the file to fetch (e.g., 'back.jpg', 'front.jpg', 'selfie.jpg')
     * @returns Object with file details and public URL
     */
    async FetchPersonIdFile(personUuid: string, fileName: 'back.jpg' | 'front.jpg' | 'selfie.jpg') {
        try {
            const filePath = `person/${personUuid}/${fileName}`;
            
            const { data } = supabase.storage
                .from('id-uploads')
                .getPublicUrl(filePath);

            return {
                name: fileName,
                path: filePath,
                publicUrl: data.publicUrl
            };
        } catch (error) {
            console.error('FetchPersonIdFile exception:', error);
            throw error;
        }
    }

    /**
     * Download a file from the id-uploads bucket
     * @param filePath - Full path to the file (e.g., 'person/uuid/back.jpg')
     * @returns Blob data of the file
     */
    async DownloadFile(filePath: string) {
        try {
            const { data, error } = await supabase.storage
                .from('id-uploads')
                .download(filePath);

            if (error) {
                console.error('Error downloading file:', error);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('DownloadFile exception:', error);
            throw error;
        }
    }

}