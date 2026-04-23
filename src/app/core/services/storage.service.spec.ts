import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('guarda y recupera valores serializables', () => {
    const data = { foo: 'bar', n: 42 };
    service.set('key1', data);
    expect(service.get<typeof data>('key1')).toEqual(data);
  });

  it('devuelve null si la clave no existe', () => {
    expect(service.get('no-existe')).toBeNull();
  });

  it('elimina la clave al guardar null', () => {
    service.set('key1', { x: 1 });
    service.set('key1', null);
    expect(service.get('key1')).toBeNull();
  });

  it('remove limpia la clave', () => {
    service.set('key1', { x: 1 });
    service.remove('key1');
    expect(service.get('key1')).toBeNull();
  });

  it('devuelve null si el contenido está corrupto', () => {
    localStorage.setItem('key1', 'esto no es JSON válido {{{');
    expect(service.get('key1')).toBeNull();
  });
});
