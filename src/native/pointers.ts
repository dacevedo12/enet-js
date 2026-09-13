declare const pointerType: unique symbol;

// Koffi pointers are plain bigints; track the pointed-to type at compile time
type NativePointer<Type extends string> = bigint & {
  readonly [pointerType]: Type;
};

export type { NativePointer };
