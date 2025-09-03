// import { PersonSearchService } from "@/services/personSearch";
// import { useEffect } from "react";

// export const usePersonSearch = async (headSearchText, HHHEAD) => {
//     useEffect(() => {
//         const handlePersonSearch = async () => {
//             if (!headSearchText) return;
//             const search = new PersonSearchService(headSearchText);
//             const result = await search.execute();
//             console.log(result)
//             result.forEach((person) => {
//                 if (!HHHEAD.some(existing => existing.person_id === person.person_id)) {
//                     HHHEAD.push(person);
//                 }
//             });
//         }
//     })
// }