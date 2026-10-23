import type { JSX } from 'react';
import { FileLineLink } from './FileLineLink';

const REPO = 'https://github.com/dpmorgandev/uinsure-policies-api/blob/';
const HEAD = '8ea8f604d6be272a478d5938d0a05f3c31d6f874';
const PATH = 'src/Uinsure.Policies.Api/Contracts/PolicyMappings.cs';

export const examples: { state: string; element: JSX.Element }[] = [
  {
    state: 'pop',
    element: <FileLineLink path={PATH} line={37} href={`${REPO}${HEAD}/${PATH}#L37`} />,
  },
  {
    state: 'line absent',
    element: <FileLineLink path="docs/qa/build-F2.md" href={`${REPO}main/docs/qa/build-F2.md`} />,
  },
];
