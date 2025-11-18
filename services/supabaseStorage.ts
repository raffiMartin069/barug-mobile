import { supabase } from '@/constants/supabase';

export class SupabaseStorageService {
  private bucketName = 'business-proofs';

  // Workaround: Get file list from database instead of storage listing
  async getBusinessProofImagesFromDB(businessId: number): Promise<Array<{ name: string; signed_url: string | null }>> {
    try {
      // Query your database for file records instead of listing storage
      const { data: fileRecords, error } = await supabase
        .from('business_files') // Replace with your actual table name
        .select('file_name, file_path')
        .eq('business_id', businessId);

      if (error || !fileRecords) {
        console.log('No file records found in database');
        return [];
      }

      return fileRecords.map(record => ({
        name: record.file_name,
        signed_url: supabase.storage.from(this.bucketName).getPublicUrl(record.file_path).data.publicUrl
      }));
    } catch (error) {
      console.error('Error getting files from database:', error);
      return [];
    }
  }

  async getBusinessProofImages(businessId: number): Promise<Array<{ name: string; signed_url: string | null }>> {
    try {
      const folderPath = `business/${businessId}/proofs`;
      
      // List files in the business proof folder
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list(folderPath, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error('Storage list error:', error);
        return [];
      }

      if (!files || files.length === 0) {
        return [];
      }

      // Generate public URLs for each file
      const filesWithUrls = files
        .filter(file => file.name && !file.name.endsWith('/')) // Filter out folders
        .map((file) => {
          const { data } = supabase.storage
            .from(this.bucketName)
            .getPublicUrl(`${folderPath}/${file.name}`);

          return {
            name: file.name,
            signed_url: data.publicUrl
          };
        });

      return filesWithUrls;
    } catch (error) {
      console.error('Error getting business proof images:', error);
      return [];
    }
  }
}

export const supabaseStorage = new SupabaseStorageService();