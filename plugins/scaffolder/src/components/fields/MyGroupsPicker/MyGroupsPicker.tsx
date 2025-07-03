/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { identityApiRef, useApi } from '@backstage/core-plugin-api';
import useAsync from 'react-use/esm/useAsync';
import { MyGroupsPickerProps, MyGroupsPickerSchema } from './schema';
import { useTranslationRef } from '@backstage/core-plugin-api/alpha';
import { scaffolderTranslationRef } from '../../../translation';
import { EntityPicker } from '../EntityPicker/EntityPicker';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import { ScaffolderField } from '@backstage/plugin-scaffolder-react/alpha';
import { RELATION_HAS_MEMBER } from '@backstage/catalog-model';

export { MyGroupsPickerSchema };

export const MyGroupsPicker = (props: MyGroupsPickerProps) => {
  const { t } = useTranslationRef(scaffolderTranslationRef);
  const {
    schema: {
      title = t('fields.myGroupsPicker.title'),
      description = t('fields.myGroupsPicker.description'),
    },
    uiSchema,
    required,
  } = props;

  const identityApi = useApi(identityApiRef);
  const { loading, value: identityRef } = useAsync(async () => {
    const identity = await identityApi.getBackstageIdentity();
    return identity.userEntityRef;
  });

  // const catalogFilter = lodash.merge(uiSchema['ui:options']?.catalogFilter ?? {}, {
  //   kind: ['Group'],
  //   'relations.hasMember': [userEntityRef!],
  // });

  // const myGroupsUiSchema = {
  //   ...uiSchema,
  //   'ui:options': {
  //     catalogFilter,
  //     defaultKind: 'Group',
  //     allowArbitraryValues:
  //       uiSchema['ui:options']?.allowArbitraryValues ?? true,
  //   },
  // };

  if (loading)
    return (
      <ScaffolderField
        rawDescription={uiSchema['ui:description'] ?? description}
        required={required}
        disabled={uiSchema['ui:disabled']}
      >
        <Autocomplete
          loading={loading}
          renderInput={params => (
            <TextField
              {...params}
              label={title}
              margin="dense"
              FormHelperTextProps={{
                margin: 'dense',
                style: { marginLeft: 0 },
              }}
              variant="outlined"
              required={required}
              InputProps={params.InputProps}
            />
          )}
          options={[]}
        />
      </ScaffolderField>
    );

  const entityPickerUISchema = buildEntityPickerUISchema(uiSchema, identityRef);

  return <EntityPicker {...props} uiSchema={entityPickerUISchema} />;
};

/**
 * Builds a `uiSchema` for an `EntityPicker` from a parent `OwnedEntityPicker`.
 * Migrates deprecated parameters such as `allowedKinds` to `catalogFilter` structure.
 *
 * @param uiSchema The `uiSchema` of an `OwnedEntityPicker` component.
 * @param identityRef The user identityRef.
 * @returns The `uiSchema` for an `EntityPicker` component.
 */
function buildEntityPickerUISchema(
  uiSchema: MyGroupsPickerProps['uiSchema'],
  identityRef: string | undefined,
): MyGroupsPickerProps['uiSchema'] {
  // Note: This is typed to avoid es-lint rule TS2698
  const uiOptions: MyGroupsPickerProps['uiSchema']['ui:options'] =
    uiSchema?.['ui:options'] || {};
  const { allowedKinds, ...extraOptions } = uiOptions;

  const catalogFilter = asArray(uiOptions.catalogFilter).map(e => ({
    ...e,
    ...(allowedKinds ? { kind: allowedKinds } : {}),
    [`relations.${RELATION_HAS_MEMBER}`]: identityRef || '',
  }));

  return {
    'ui:options': {
      ...extraOptions,
      catalogFilter,
      allowArbitraryValues: uiOptions.allowArbitraryValues ?? true,
    },
  };
}

function asArray(catalogFilter: any): any[] {
  if (catalogFilter) {
    return Array.isArray(catalogFilter) ? catalogFilter : [catalogFilter];
  }
  return [{}];
}
