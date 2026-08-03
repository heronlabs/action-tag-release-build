import {faker} from '@faker-js/faker';

import {NpmService} from '../../../../../src/core/services/bumpers/npm-bumper-service';
import {
  ChildProcessServiceMock,
  ChildProcessServiceMoq,
} from '../../../../__mocks__/infrastructure/child-process-service-mock';

describe('Given a npm bumper service', () => {
  let service: NpmService;

  beforeEach(() => {
    service = new NpmService(ChildProcessServiceMoq);
  });

  it('Should update version on package.json', () => {
    const npmVersionResult = faker.lorem.sentence();
    ChildProcessServiceMock.exec.mockReturnValueOnce({
      ok: true,
      data: npmVersionResult,
    });

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: true,
      data: npmVersionResult,
    });
  });

  it('Should call npm version command with correct arguments', () => {
    const version = faker.system.semver();
    ChildProcessServiceMock.exec.mockReturnValueOnce({
      ok: true,
      data: 'OK',
    });

    service.bump(version);

    expect(ChildProcessServiceMock.exec).toHaveBeenCalledWith('npm', [
      'version',
      version,
      '--no-git-tag-version',
    ]);
  });

  it('Should return error when npm version command fails', () => {
    const error = new Error(faker.lorem.sentence());
    ChildProcessServiceMock.exec.mockReturnValueOnce({
      ok: false,
      error,
    });

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });
});
