export type ChangeFn<
  T extends (...args: any) => any,
  EP extends any[] = [],
  CP extends any[] | undefined = undefined,
  ER extends object = {},
  CR = undefined
> =
  T extends (...args: infer V) => infer U?
    CP extends undefined?
      CR extends undefined?
        (...args: [...V, ...EP]) => U & ER:
        (...args: [...V, ...EP]) => CR:
    CP extends any[]?
      CR extends undefined?
        (...args: CP) => U & ER:
        (...args: CP) => CR:
    never:
  never;

type PlaceHolder = { __placeholder__: never };

type FillWith<T extends object, U> = {
    [K in keyof T]:
        T[K] extends PlaceHolder? U:
        T[K] extends object? FillWith<T[K], U>:
        T[K]
};

type a = { b: number, c: { e: PlaceHolder, f: number }, d: PlaceHolder };
type fa = FillWith<a, number>;