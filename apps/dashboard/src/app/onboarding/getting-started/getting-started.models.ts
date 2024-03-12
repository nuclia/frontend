export type ItemToUpload = {
  id: string;
  title: string;
  file?: File;
  link?: string;
  uuid?: string;
  uploaded?: boolean;
  uploadFailed?: boolean;
  processing?: boolean;
  processed?: boolean;
  estimation?: number;
  uploadProgress?: number;
  rank?: number;
};
