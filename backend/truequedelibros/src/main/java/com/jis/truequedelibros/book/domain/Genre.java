package com.jis.truequedelibros.book.domain;

public enum Genre {
    FICCION("Ficción"),
    NO_FICCION("No Ficción"),
    CIENCIA_FICCION("Ciencia Ficción"),
    FANTASIA("Fantasía"),
    MISTERIO("Misterio"),
    ROMANCE("Romance"),
    HISTORIA("Historia"),
    CIENCIAS("Ciencias"),
    FILOSOFIA("Filosofía"),
    ARTE("Arte"),
    INFANTIL("Infantil"),
    JUVENIL("Juvenil"),
    AUTOAYUDA("Autoayuda"),
    BIOGRAFIA("Biografía"),
    TERROR("Terror"),
    PSICOLOGIA("Psicología"),
    TECNOLOGIA("Tecnología"),
    NEGOCIOS("Negocios"),
    COCINA("Cocina"),
    POESIA("Poesía"),
    POLITICA("Política"),
    OTROS("Otros");

    private final String label;

    Genre(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
