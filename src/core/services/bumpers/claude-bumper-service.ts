import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

import {Bumper} from '../../interfaces/bumper';

export class ClaudeService implements Bumper {
  bump(version: string) {
    try {
      const pluginJson = join(this.cwd, this.pluginDir, 'plugin.json');
      const hasPlugin = existsSync(pluginJson);
      if (!hasPlugin) {
        return {
          ok: false as const,
          error: new Error(`plugin.json not found at ${pluginJson}`),
        };
      }

      const marketplaceJson = join(
        this.cwd,
        this.pluginDir,
        'marketplace.json',
      );
      const hasMarketplace = existsSync(marketplaceJson);
      if (!hasMarketplace) {
        return {
          ok: false as const,
          error: new Error(`marketplace.json not found at ${marketplaceJson}`),
        };
      }

      const plugin = JSON.parse(readFileSync(pluginJson, 'utf8')) as Record<
        string,
        unknown
      >;

      const pluginName = plugin.name;
      if (!pluginName) {
        return {
          ok: false as const,
          error: new Error('plugin.json exists but has no .name field'),
        };
      }

      if (plugin.version !== version) {
        plugin.version = version;
        writeFileSync(pluginJson, JSON.stringify(plugin, null, 2) + '\n');
      }

      const marketplace = JSON.parse(
        readFileSync(marketplaceJson, 'utf8'),
      ) as Array<Record<string, unknown>>;

      const entry = marketplace.find(item => item.name === pluginName);
      if (!entry) {
        return {
          ok: false as const,
          error: new Error(
            `marketplace.json has no entry matching plugin name '${pluginName}'`,
          ),
        };
      }

      if (entry.version !== version) {
        entry.version = version;
        writeFileSync(
          marketplaceJson,
          JSON.stringify(marketplace, null, 2) + '\n',
        );
      }
      return {ok: true as const, data: 'OK'};
    } catch (error) {
      return {ok: false as const, error};
    }
  }

  constructor(
    private readonly cwd: string,
    private readonly pluginDir: string,
  ) {}
}
