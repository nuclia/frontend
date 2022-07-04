import { FileWithMetadata } from '@nuclia/core';
import { Observable } from 'rxjs';
import SparkMD5 from 'spark-md5';

export function md5(file: File | FileWithMetadata): Observable<FileWithMetadata> {
  return new Observable((observer) => {
    let currentChunk = 0;
    const chunkSize = 2097152;
    const chunks = Math.ceil(file.size / chunkSize);
    const spark = new SparkMD5.ArrayBuffer();
    const reader = new FileReader();

    loadNext();

    reader.onloadend = (e) => {
      if (e.target?.result && typeof e.target.result !== 'string') {
        spark.append(e.target.result);
        currentChunk++;
        if (currentChunk < chunks) {
          loadNext();
        } else {
          (file as FileWithMetadata).md5 = spark.end();
          observer.next(file);
          observer.complete();
        }
      }
    };

    function loadNext() {
      const start = currentChunk * chunkSize;
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize;
      reader.readAsArrayBuffer(file.slice(start, end));
    }
  });
}
