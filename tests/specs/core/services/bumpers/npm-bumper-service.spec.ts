import {faker} from '@faker-js/faker';

import {NpmService} from '../../../../../src/core/services/bumpers/npm-bumper-service';
import {
  childProcessServiceMock,
  childProcessServiceMoq,
} from '../../../../__mocks__/infrastructure/child-process-service-mock';

describe('Given a npm bumper service', () => {
  let service: NpmService;

  beforeEach(() => {
    service = new NpmService(childProcessServiceMoq);
  });

  it('Should return ok with command output on success', () => {
    const npmVersionResult = faker.lorem.sentence();
    childProcessServiceMock.exec.mockReturnValueOnce({
      ok: true,
      data: npmVersionResult,
    });

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: true,
      data: npmVersionResult,
    });
  });
  it('Should return error when npm version command fails', () => {
    const error = new Error(faker.lorem.sentence());
    childProcessServiceMock.exec.mockReturnValueOnce({
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
