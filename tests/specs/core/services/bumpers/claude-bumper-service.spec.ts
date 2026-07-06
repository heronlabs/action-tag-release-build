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

    const newVersion = faker.system.semver();
    const output = service.bump(newVersion);

    expect(output).toStrictEqual({
      ok: true,
      data: 'OK',
    });
  });

  it('Should write new version in both plugin.json', () => {
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

    const newVersion = faker.system.semver();
    service.bump(newVersion);

    expect(writeFileSync).toHaveBeenNthCalledWith(
      1,
      join(cwd, 'plugin.json'),
      JSON.stringify({...pluginJson, version: newVersion}, null, 2) + '\n',
    );
  });

  it('Should write new version in marketplace.json', () => {
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

    const newVersion = faker.system.semver();
    service.bump(newVersion);

    expect(writeFileSync).toHaveBeenNthCalledWith(
      2,
      join(cwd, 'marketplace.json'),
      JSON.stringify([{name: pluginJson.name, version: newVersion}], null, 2) +
        '\n',
    );
  });

  it('Should skip version when already matching in plugin and marketplace', () => {
    const version = faker.system.semver();

    const pluginJson = {
      name: faker.lorem.word(),
      version,
    };
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(pluginJson));

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

    service.bump(version);

    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it('Should update only plugin.json when marketplace entry version already matches', () => {
    const pluginJson = {
      name: faker.lorem.word(),
      version: faker.system.semver(),
    };
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(pluginJson));
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const newVersion = faker.system.semver();
    const marketplaceJson = [
      {
        name: pluginJson.name,
        version: newVersion,
      },
    ];
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(
      JSON.stringify(marketplaceJson),
    );

    const output = service.bump(newVersion);

    expect(output).toStrictEqual({
      ok: true,
      data: 'OK',
    });
  });

  it('Should write new version only on plugin.json when marketplace entry version already matches', () => {
    const pluginJson = {
      name: faker.lorem.word(),
      version: faker.system.semver(),
    };
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(JSON.stringify(pluginJson));
    vi.mocked(writeFileSync).mockImplementationOnce(() => {});

    const newVersion = faker.system.semver();
    const marketplaceJson = [
      {
        name: pluginJson.name,
        version: newVersion,
      },
    ];
    vi.mocked(existsSync).mockReturnValueOnce(true);
    vi.mocked(readFileSync).mockReturnValueOnce(
      JSON.stringify(marketplaceJson),
    );

    service.bump(newVersion);

    expect(writeFileSync).toHaveBeenCalledWith(
      join(cwd, 'plugin.json'),
      JSON.stringify({...pluginJson, version: newVersion}, null, 2) + '\n',
    );
  });

  it('Should return error plugin.json not found', () => {
    vi.mocked(existsSync).mockReturnValueOnce(false);

    const output = service.bump(faker.system.semver());

    expect(output).toStrictEqual({
      ok: false,
      error: new Error(`plugin.json not found at ${join(cwd, 'plugin.json')}`),
    });
  });

  it('Should return error marketplace.json not found', () => {
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

  it('Should return error error when plugin.json has no name field', () => {
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

  it('Should return error marketplace.json has no entry matching plugin name', () => {
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

  it('Should return error unexpected error when bumping', () => {
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
