import { createRef } from 'react';

const pickerRef = createRef();

function open() {
    pickerRef.current.focus();
}

function close() {
    pickerRef.current.blur();
}

export { pickerRef, open, close };