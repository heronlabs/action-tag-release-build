import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {faker} from '@faker-js/faker';

import {ClaudeService} from '../../../../../src/core/services/bumpers/claude-bumper-service';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('Given a claude bumper service', () => {
  const cwd = faker.system.directoryPath();
  let service: ClaudeService;

  beforeEach(() => {
    service = new ClaudeService(cwd);
  });
  it('Should update version in both plugin.json and marketplace.json', () => {
    const pluginJson = {
      name: faker.lorem.word(),
      version: faker.system.semver(),
    };
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(pluginJson));
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const marketplaceJson = [
      {
        name: pluginJson.name,
        version: pluginJson.version,
      },
    ];
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(
      JSON.stringify(marketplaceJson),
    );
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: true,
      data: 'OK',
    });
  });

  it('Should skip version in both plugin.json and marketplace.json', () => {
    const version = faker.system.semver();

    const pluginJson = {
      name: faker.lorem.word(),
      version,
    };
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(pluginJson));
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const marketplaceJson = [
      {
        name: pluginJson.name,
        version: pluginJson.version,
      },
    ];
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(
      JSON.stringify(marketplaceJson),
    );
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.bump(version);

    expect(output).toStrictEqual({
      ok: true,
      data: 'OK',
    });
  });

  it('Should throw plugin.json not found', () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: false,
      error: new Error(`plugin.json not found at ${join(cwd, 'plugin.json')}`),
    });
  });

  it('Should throw marketplace.json not found', () => {
    const pluginJson = {
      name: faker.lorem.word(),
      version: faker.system.semver(),
    };
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(pluginJson));
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    vi.mocked(existsSync).mockReturnValueOnce(false);

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: false,
      error: new Error(
        `marketplace.json not found at ${join(cwd, 'marketplace.json')}`,
      ),
    });
  });

  it('Should throw error when plugin.json has no name field', () => {
    const pluginJson = {
      version: faker.system.semver(),
    };
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(pluginJson));

    vi.mocked(existsSync).mockReturnValueOnce(true);

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: false,
      error: new Error('plugin.json exists but has no .name field'),
    });
  });

  it('Should throw marketplace.json has no entry matching plugin name', () => {
    const pluginJson = {
      name: faker.lorem.word(),
      version: faker.system.semver(),
    };
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(pluginJson));
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const marketplaceJson = [
      {
        name: faker.lorem.word(),
        version: faker.system.semver(),
      },
    ];
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(
      JSON.stringify(marketplaceJson),
    );
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: false,
      error: new Error(
        `marketplace.json has no entry matching plugin name '${pluginJson.name}'`,
      ),
    });
  });

  it('Should throw unexpected error when bumping', () => {
    const error = new Error(faker.lorem.sentence());
    vi.mocked(existsSync).mockImplementationOnce(() => {
      throw error;
    });

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: false,
      error,
    });
  });
});
