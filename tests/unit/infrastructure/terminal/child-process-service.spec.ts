import {execFileSync} from 'node:child_process';

import {faker} from '@faker-js/faker';

import {ChildProcessService} from '../../../../src/infrastructure/terminal/services/child-process-service';

vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}));

describe('Given a child process service', () => {
  const cwd = faker.system.directoryPath();
  let service: ChildProcessService;

  beforeEach(() => {
    service = new ChildProcessService(cwd);
  });

  describe('Given exec method', () => {
    it('Should execute and parse result', () => {
      const data = 'Everything up to date';
      vi.mocked(execFileSync).mockImplementationOnce(() => data);

      const output = service.exec('git', ['status']);

      expect(output).toStrictEqual({
        ok: true,
        data,
      });
    });

    it('Should trim whitespace from exec output', () => {
      const rawData = '  \nEverything up to date\n  ';
      vi.mocked(execFileSync).mockImplementationOnce(() => rawData);

      const output = service.exec('git', ['status']);

      expect(output).toStrictEqual({
        ok: true,
        data: 'Everything up to date',
      });
    });

    it('Should pass command, args and options to execFileSync in exec', () => {
      vi.mocked(execFileSync).mockImplementationOnce(() => 'OK');

      service.exec('git', ['status']);

      expect(execFileSync).toHaveBeenCalledWith('git', ['status'], {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    });

    it('Should not interpret shell syntax in arguments', () => {
      vi.mocked(execFileSync).mockImplementationOnce(() => 'OK');

      service.exec('git', ['tag', '-a', 'v1.0.0; rm -rf /']);

      expect(execFileSync).toHaveBeenCalledWith(
        'git',
        ['tag', '-a', 'v1.0.0; rm -rf /'],
        {
          cwd,
          encoding: 'utf8',
          stdio: 'pipe',
        },
      );
    });

    it('Should return error on execution', () => {
      const error = new Error(faker.lorem.sentence());
      vi.mocked(execFileSync).mockImplementationOnce(() => {
        throw error;
      });

      const output = service.exec('git', ['status']);

      expect(output).toStrictEqual({
        ok: false,
        error,
      });
    });

    it('Should append the failed invocation to the error message', () => {
      const error = new Error('Command failed: git');
      vi.mocked(execFileSync).mockImplementationOnce(() => {
        throw error;
      });

      service.exec('git', ['push', '--follow-tags']);

      expect(error.message).toBe(
        'Command failed: git [git push --follow-tags]',
      );
    });

    it('Should append stderr to the error message when present', () => {
      const error = Object.assign(new Error('Command failed: git'), {
        stderr: Buffer.from('fatal: not a git repository\n'),
      });
      vi.mocked(execFileSync).mockImplementationOnce(() => {
        throw error;
      });

      service.exec('git', ['status']);

      expect(error.message).toBe(
        'Command failed: git [git status]\nfatal: not a git repository',
      );
    });

    it('Should return a non Error rejection untouched', () => {
      vi.mocked(execFileSync).mockImplementationOnce(() => {
        throw 'boom';
      });

      const output = service.exec('git', ['status']);

      expect(output).toStrictEqual({
        ok: false,
        error: 'boom',
      });
    });
  });

  describe('Given exec chain method', () => {
    it('Should exec chain with success on start', () => {
      const data = 'Everything up to date';
      vi.mocked(execFileSync)
        .mockImplementationOnce(() => 'Added')
        .mockImplementationOnce(() => 'Commited')
        .mockImplementationOnce(() => data);

      const output = service
        .execChain('git', ['add', '.'])
        .execChain('git', ['commit', '-m', 'dooby'])
        .execChain('git', ['push']);

      expect(output).toStrictEqual({
        ok: true,
        data: 'Everything up to date',
        execChain: expect.any(Function),
      });
    });

    it('Should trim whitespace from execChain output', () => {
      const rawData = '  \nPushed\n  ';
      vi.mocked(execFileSync).mockImplementationOnce(() => rawData);

      const output = service.execChain('git', ['push']);

      expect(output).toStrictEqual({
        ok: true,
        data: 'Pushed',
        execChain: expect.any(Function),
      });
    });

    it('Should pass command, args and options to execFileSync in execChain', () => {
      vi.mocked(execFileSync).mockImplementationOnce(() => 'Added');

      service.execChain('git', ['add', '-A']);

      expect(execFileSync).toHaveBeenCalledWith('git', ['add', '-A'], {
        cwd,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    });

    it('Should exec chain with failure on start', () => {
      const error = new Error(faker.lorem.sentence());
      vi.mocked(execFileSync)
        .mockImplementationOnce(() => {
          throw error;
        })
        .mockImplementationOnce(() => 'Commited')
        .mockImplementationOnce(() => 'Everything up to date');

      const output = service
        .execChain('git', ['add', '.'])
        .execChain('git', ['commit', '-m', 'dooby'])
        .execChain('git', ['push']);

      expect(output).toStrictEqual({
        ok: false,
        error,
        execChain: expect.any(Function),
      });

      expect(execFileSync).toHaveBeenCalledTimes(1);
    });

    it('Should exec chain with failure on middle', () => {
      const error = new Error(faker.lorem.sentence());
      vi.mocked(execFileSync)
        .mockImplementationOnce(() => 'Added')
        .mockImplementationOnce(() => {
          throw error;
        })
        .mockImplementationOnce(() => 'Everything up to date');

      const output = service
        .execChain('git', ['add', '.'])
        .execChain('git', ['commit', '-m', 'dooby'])
        .execChain('git', ['push']);

      expect(output).toStrictEqual({
        ok: false,
        error,
        execChain: expect.any(Function),
      });
    });

    it('Should exec chain with failure on end', () => {
      const error = new Error(faker.lorem.sentence());
      vi.mocked(execFileSync)
        .mockImplementationOnce(() => 'Added')
        .mockImplementationOnce(() => 'Commited')
        .mockImplementationOnce(() => {
          throw error;
        });

      const output = service
        .execChain('git', ['add', '.'])
        .execChain('git', ['commit', '-m', 'dooby'])
        .execChain('git', ['push']);

      expect(output).toStrictEqual({
        ok: false,
        error,
        execChain: expect.any(Function),
      });
    });
  });
});
