declare module 'formidable' {
  import { IncomingMessage } from 'http';

  interface Fields {
    [key: string]: string[];
  }

  interface Files {
    [key: string]: {
      filepath: string;
      mimetype?: string;
      size: number;
      originalFilename?: string;
    }[];
  }

  interface FormidableOptions {
    uploadDir?: string;
    keepExtensions?: boolean;
    maxFileSize?: number;
    multiples?: boolean;
  }

  class Formidable {
    constructor(options?: FormidableOptions);
    parse(
      req: IncomingMessage,
      callback: (err: Error | null, fields: Fields, files: Files) => void
    ): void;
  }

  export default function formidable(options?: FormidableOptions): Formidable;
} 