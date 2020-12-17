import React from 'react';

import schema from './data/schema.json';
import { DomainGraph } from '../domain-graph';
import { Schema } from '../tools/types';

const x = (schema as any) as Schema;

export const Shim: React.FC<{}> = () => {
  return <DomainGraph schema={x} />;
};

// const MainPage: React.FC = () => {
//   const { nodes, edges } = useDataSource();

//   if (nodes.length) {
//     return <Graph width={1200} height={800} edges={edges} nodes={nodes} />;
//   } else {
//     return <Uploader />;
//   }
// };

// const Uploader: React.FC = () => {
//   const { setSchema } = useDataSource();

//   const [dropReady, setDropReady] = useState(false);

//   const handleDragOver = useCallback(
//     (event: React.DragEvent<HTMLDivElement>) => {
//       event.stopPropagation();
//       event.preventDefault();
//     },
//     [],
//   );

//   const handleDrop = useCallback(
//     async (event: React.DragEvent<HTMLDivElement>) => {
//       // Prevent default behavior (Prevent file from being opened)
//       event.preventDefault();

//       const file = event.dataTransfer.files[0];

//       const arrayBuffer = await file.arrayBuffer();

//       const text = new TextDecoder().decode(arrayBuffer);

//       const schema = JSON.parse(text);
//       setSchema(schema);
//     },
//     [setSchema],
//   );

//   return (
//     <div
//       className={`c-uploader${dropReady ? ' drop-ready' : ''}`}
//       onDragOver={handleDragOver}
//       onDragEnter={() => setDropReady(true)}
//       onDragLeave={() => setDropReady(false)}
//       onDrop={handleDrop}
//     >
//       <UploadCloud size={200} strokeWidth={8} />
//       <h1>Drop a schema file here to get started!</h1>

//       <p>
//         To get a schema file, run the Apollo introspection query. Save the
//         results and drag the file into this box.
//       </p>
//     </div>
//   );
// };
