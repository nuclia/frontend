import { ReadableResource, Resource } from '../resource';
import { ISession } from './session.models';

/**
 * Implements all the read operation on sessions.
 *
 * A session allows you to store content in the Retrieval Agent.
 * A single sessio might contain several fields.
 *
 * Fields have different types: files, links, texts, conversations, etc.
 */
export class ReadableSession extends ReadableResource implements ISession {}

/**
 * Extends `ReadableSession` and implements all the write operations.
 */
export class Session extends Resource implements ISession {}
