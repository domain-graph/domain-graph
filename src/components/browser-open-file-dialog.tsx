import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import { OpenFilesResult } from '../data-provider';

export interface BrowserOpenFileDialogProps {
  accept?: string;
  multiple?: boolean;
}

export const BrowserOpenFileDialog = forwardRef(
  ({ accept, multiple }: BrowserOpenFileDialogProps, ref) => {
    const resolver = useRef<(results: OpenFilesResult) => void>();
    const timer = useRef<NodeJS.Timeout>();
    const inputRef = useRef<HTMLInputElement>(null);
    const isOpen = useRef<boolean>();

    useImperativeHandle(ref, () => ({
      open: () => {
        inputRef.current?.focus();
        inputRef.current?.click();
        isOpen.current = true;
        return new Promise((resolve) => {
          resolver.current = resolve;
        });
      },
    }));

    const handleFocus = useCallback(() => {
      const delay = 100;

      if (isOpen.current) {
        timer.current = setTimeout(() => {
          resolver.current?.({
            canceled: true,
            files: [],
          });
          isOpen.current = false;
          resolver.current = undefined;
        }, delay) as unknown as NodeJS.Timeout;
      }
    }, []);

    const handleChange = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (timer.current) clearTimeout(timer.current);

        const files: OpenFilesResult['files'] = [];

        if (event.target.files) {
          for (let i = 0; i < event.target.files.length; i++) {
            const item = event.target.files.item(i);

            if (item) {
              files.push({
                filePath: item?.name,
                contents: await item.text(),
              });
            }
          }
        }

        resolver.current?.({
          canceled: false,
          files,
        });

        isOpen.current = false;
        resolver.current = undefined;
      },
      [],
    );

    return (
      <label
        style={{ opacity: 0, pointerEvents: 'none', position: 'fixed' }}
        tabIndex={-1}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          onFocus={handleFocus}
        />
      </label>
    );
  },
);
