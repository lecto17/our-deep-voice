// 스네이크 케이스를 카멜 케이스로 변환하는 유틸리티 함수
const snakeToCamel = (str: string): string => {
  if (str === '' || str == null) {
    throw new Error('Error on snakeToCamel: str is empty');
  }
  if (!str.includes('_')) {
    return str;
  }

  return str
    .split('_')
    .map((word, idx) =>
      idx === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');
};

// 객체의 키를 스네이크 케이스에서 카멜 케이스로 변환
const transformKeys = (
  obj: Record<string, unknown>,
): Record<string, unknown> => {
  const transformed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const pascalKey = snakeToCamel(key);
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !(value instanceof Date)
    ) {
      // 중첩된 객체에 대해 재귀적으로 transformKeys 적용
      transformed[pascalKey] = transformKeys(value as Record<string, unknown>);
    } else {
      transformed[pascalKey] = value;
    }
  }

  return transformed;
};

// API 응답을 원하는 스키마 형식으로 변환하는 맵퍼
export const objectMapper = (object: Record<string, unknown>) => {
  return transformKeys(object);
};

// 특정 필드만 변환하는 맵퍼 (더 세밀한 제어)
export const objectsMapperWithFields = (
  datas: Record<string, unknown>[],
  fieldMappings: Record<string, string>,
) => {
  return datas.map((data) => {
    const transformed: Record<string, unknown> = {};

    for (const [originalKey, newKey] of Object.entries(fieldMappings)) {
      if (data[originalKey] !== undefined) {
        transformed[newKey] = data[originalKey];
      }
    }

    // 나머지 필드는 그대로 유지
    Object.keys(data).forEach((key) => {
      if (!fieldMappings[key]) {
        transformed[key] = data[key];
      }
    });

    return transformed;
  });
};
