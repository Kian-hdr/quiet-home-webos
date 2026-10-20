// Optional publisher artwork is fetched separately and is not MIT-licensed code.
// Without generated files, live TV discovery uses the provider's original native icon.
interface Generated { ARTWORK:Record<string,string>; }
const modules=import.meta.glob<Generated>('./artwork.generated.ts',{eager:true});
export const ORIGINAL_ARTWORK:Record<string,string>=modules['./artwork.generated.ts']?.ARTWORK||{};
