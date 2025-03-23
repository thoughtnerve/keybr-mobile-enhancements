import { Language } from "@keybr/keyboard";
import { Enum, type EnumItem } from "@keybr/lang";
import coverImageAliceWonderland from "../../assets/cover-image-alice-wanderland.jpg";
import coverImageCallWild from "../../assets/cover-image-call-wild.jpg";
import coverImageJekyllHyde from "../../assets/cover-image-jekyll-hyde.jpg";

export class Book implements EnumItem {
  static readonly EN_ALICE_WONDERLAND = new Book(
    /* id= */ "en-alice-wonderland",
    /* language= */ Language.EN,
    /* title= */ "Alice's Adventures in Wonderland",
    /* author= */ "Lewis Carroll",
    /* coverImage= */ coverImageAliceWonderland,
  );

  static readonly EN_JEKYLL_HYDE = new Book(
    /* id= */ "en-jekyll-hyde",
    /* language= */ Language.EN,
    /* title= */ "The Strange Case Of Dr. Jekyll And Mr. Hyde",
    /* author= */ "Robert Louis Stevenson",
    /* coverImage= */ coverImageJekyllHyde,
  );

  static readonly EN_CALL_WILD = new Book(
    /* id= */ "en-call-wild",
    /* language= */ Language.EN,
    /* title= */ "The Call of the Wild",
    /* author= */ "Jack London",
    /* coverImage= */ coverImageCallWild,
  );

  static readonly EN_MY_DOCUMENT = new Book(
    /* id= */ "en-my-document",
    /* language= */ Language.EN,
    /* title= */ "My Document",
    /* author= */ "User",
    /* coverImage= */ coverImageAliceWonderland,
  );

  static readonly ALL = new Enum<Book>(
    Book.EN_ALICE_WONDERLAND,
    Book.EN_JEKYLL_HYDE,
    Book.EN_CALL_WILD,
    Book.EN_MY_DOCUMENT,
  );

  private constructor(
    readonly id: string,
    readonly language: Language,
    readonly title: string,
    readonly author: string,
    readonly coverImage: string,
  ) {
    Object.freeze(this);
  }

  toString() {
    return this.id;
  }

  toJSON() {
    return this.id;
  }
}
