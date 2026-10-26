import json
import os

with open("backend/model/classes.json") as f:
    breeds = json.load(f)

# Curated specific data for prominent breeds
curated = {
    "pug": {
        "display_name": "Pug",
        "akc_group": "Toy",
        "origin": "China 🇨🇳",
        "size": "Small",
        "weight_lbs": "14 - 18 lbs",
        "life_expectancy": "13 - 15 years",
        "temperament": "Charming, Loving, Playful, Docile",
        "description": "Pugs are compact, muscular companion dogs renowned for their wrinkled brows, curled pig-like tails, and deep loyalty.",
        "energy": 2,
        "trainability": 3,
        "kid_friendly": 5,
        "apartment_friendly": 5,
        "grooming": 3,
        "fun_fact": "A group of pugs is officially called a 'Grumble'!",
        "lookalike": {
            "name": "French Bulldog",
            "tip": "Pugs have folded 'rose' ears and curled tails, whereas Frenchies have upright bat-ears and stumpy tails."
        }
    },
    "samoyed": {
        "display_name": "Samoyed",
        "akc_group": "Working",
        "origin": "Siberia, Russia 🇷🇺",
        "size": "Medium to Large",
        "weight_lbs": "45 - 65 lbs",
        "life_expectancy": "12 - 14 years",
        "temperament": "Friendly, Gentle, Adaptable, Cheerful",
        "description": "Magnificent Arctic herding dogs famous for their smiling expressions ('Sammie smile') and lush, snow-white double coats.",
        "energy": 4,
        "trainability": 3,
        "kid_friendly": 5,
        "apartment_friendly": 2,
        "grooming": 5,
        "fun_fact": "Their upturned mouth corners prevent drool from forming icicles on their faces in sub-zero Arctic temperatures!",
        "lookalike": {
            "name": "Great Pyrenees",
            "tip": "Samoyeds are smaller and feature prick ears with a curled tail, while Pyrenees have drop ears and are much larger."
        }
    },
    "beagle": {
        "display_name": "Beagle",
        "akc_group": "Hound",
        "origin": "United Kingdom 🇬🇧",
        "size": "Small to Medium",
        "weight_lbs": "20 - 30 lbs",
        "life_expectancy": "12 - 15 years",
        "temperament": "Curious, Friendly, Merry, Determined",
        "description": "Sturdy hunting hounds with an unmatched sense of smell and cheerful, loving family demeanor.",
        "energy": 4,
        "trainability": 3,
        "kid_friendly": 5,
        "apartment_friendly": 3,
        "grooming": 2,
        "fun_fact": "Beagles have approximately 220 million scent receptors compared to about 5 million in humans!",
        "lookalike": {
            "name": "Basset Hound",
            "tip": "Beagles have much longer legs and lighter, athletic frames compared to the short-legged, heavy Basset."
        }
    },
    "golden_retriever": {
        "display_name": "Golden Retriever",
        "akc_group": "Sporting",
        "origin": "Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿",
        "size": "Large",
        "weight_lbs": "55 - 75 lbs",
        "life_expectancy": "10 - 12 years",
        "temperament": "Intelligent, Friendly, Devoted, Gentle",
        "description": "Exuberant, gentle-hearted sporting dogs celebrated for their lustrous golden coat and supreme trainability.",
        "energy": 4,
        "trainability": 5,
        "kid_friendly": 5,
        "apartment_friendly": 2,
        "grooming": 4,
        "fun_fact": "Golden Retrievers have 'soft mouths' bred to retrieve waterfowl without puncturing or damaging feathers.",
        "lookalike": {
            "name": "Labrador Retriever",
            "tip": "Goldens have long feathered feathering on ears, belly, and tail; Labs have a short, dense water-repellent coat."
        }
    },
    "labrador_retriever": {
        "display_name": "Labrador Retriever",
        "akc_group": "Sporting",
        "origin": "Canada 🇨🇦",
        "size": "Large",
        "weight_lbs": "55 - 80 lbs",
        "life_expectancy": "11 - 13 years",
        "temperament": "Outgoing, Even-tempered, Gentle, Agile",
        "description": "America's longtime top favorite breed, gifted with a waterproof double coat, otter tail, and boundless friendliness.",
        "energy": 5,
        "trainability": 5,
        "kid_friendly": 5,
        "apartment_friendly": 2,
        "grooming": 3,
        "fun_fact": "Labradors have webbed toes that act like natural flippers for swimming!",
        "lookalike": {
            "name": "Chesapeake Bay Retriever",
            "tip": "Chessies have wavy, oily coats with amber or light eyes, whereas Labs have smooth straight coats."
        }
    },
    "german_shepherd": {
        "display_name": "German Shepherd",
        "akc_group": "Herding",
        "origin": "Germany 🇩🇪",
        "size": "Large",
        "weight_lbs": "50 - 90 lbs",
        "life_expectancy": "7 - 10 years",
        "temperament": "Courageous, Confident, Intelligent, Watchful",
        "description": "Noble, versatile, and devoted working dogs celebrated globally for law enforcement, search and rescue, and loyal protection.",
        "energy": 5,
        "trainability": 5,
        "kid_friendly": 4,
        "apartment_friendly": 2,
        "grooming": 4,
        "fun_fact": "The very first guide dog for the blind in 1928 was a German Shepherd named Buddy!",
        "lookalike": {
            "name": "Belgian Malinois",
            "tip": "Malinois are lighter, sleeker, and narrower in bone structure with solid black masks compared to German Shepherds."
        }
    },
    "siberian_husky": {
        "display_name": "Siberian Husky",
        "akc_group": "Working",
        "origin": "Siberia, Russia 🇷🇺",
        "size": "Medium",
        "weight_lbs": "35 - 60 lbs",
        "life_expectancy": "12 - 14 years",
        "temperament": "Outgoing, Friendly, Fastidious, Playful",
        "description": "Graceful Arctic sled dogs with striking blue or multicolored eyes, high endurance, and vocal howling personalities.",
        "energy": 5,
        "trainability": 3,
        "kid_friendly": 5,
        "apartment_friendly": 2,
        "grooming": 4,
        "fun_fact": "Huskies can regulate their metabolism so they burn energy without exhausting their glycogen stores on long sled runs!",
        "lookalike": {
            "name": "Alaskan Malamute",
            "tip": "Malamutes are much heavier, have brown eyes only, and carry their tail curled over their back."
        }
    },
    "french_bulldog": {
        "display_name": "French Bulldog",
        "akc_group": "Non-Sporting",
        "origin": "France 🇫🇷",
        "size": "Small",
        "weight_lbs": "16 - 28 lbs",
        "life_expectancy": "10 - 12 years",
        "temperament": "Adaptable, Playful, Alert, Affectionate",
        "description": "Irresistible companion dogs featuring prominent bat ears, compact muscular builds, and comical attitudes.",
        "energy": 2,
        "trainability": 3,
        "kid_friendly": 5,
        "apartment_friendly": 5,
        "grooming": 2,
        "fun_fact": "Due to their heavy, compact front-heavy body structure, Frenchies cannot swim and must wear lifejackets near pools!",
        "lookalike": {
            "name": "Boston Terrier",
            "tip": "Boston Terriers have longer, leaner legs with distinct tuxedo markings and pointed rather than rounded ear tips."
        }
    },
    "pomeranian": {
        "display_name": "Pomeranian",
        "akc_group": "Toy",
        "origin": "Germany / Poland 🇩🇪",
        "size": "Toy",
        "weight_lbs": "3 - 7 lbs",
        "life_expectancy": "12 - 16 years",
        "temperament": "Lively, Extroverted, Intelligent, Feisty",
        "description": "Tiny balls of fluff with huge personalities, glorious ruffs around their necks, and fox-like inquisitive faces.",
        "energy": 3,
        "trainability": 4,
        "kid_friendly": 3,
        "apartment_friendly": 5,
        "grooming": 4,
        "fun_fact": "Queen Victoria popularized small Pomeranians in the 19th century and owned 35 of them simultaneously!",
        "lookalike": {
            "name": "Samoyed",
            "tip": "Poms are miniature toy spitz descendants (3-7 lbs), while Samoyeds are 50+ lb working Arctic giants."
        }
    },
    "basset": {
        "display_name": "Basset Hound",
        "akc_group": "Hound",
        "origin": "France 🇫🇷",
        "size": "Medium",
        "weight_lbs": "40 - 65 lbs",
        "life_expectancy": "12 - 13 years",
        "temperament": "Patient, Mild, Devoted, Charming",
        "description": "Iconic scent hounds with elongated bodies, loose droopy skin, soulful eyes, and exceptional tracking power.",
        "energy": 2,
        "trainability": 2,
        "kid_friendly": 5,
        "apartment_friendly": 4,
        "grooming": 2,
        "fun_fact": "Their long velvety ears sweep scent particles up from the ground directly toward their nose as they walk!",
        "lookalike": {
            "name": "Bloodhound",
            "tip": "Bloodhounds stand significantly taller on long legs, weighing up to 110 lbs, while Bassets are low to the ground."
        }
    }
}

# Group & Origin classification heuristics for the rest
group_keywords = {
    "Herding": ["collie", "border_collie", "shepherd", "kelpie", "groenendael", "malinois", "briard", "komondor", "shetland_sheepdog", "bouvier_des_flandres", "appenzeller", "entlebucher", "cardigan", "pembroke", "old_english_sheepdog", "rottweiler"],
    "Hound": ["hound", "beagle", "basset", "borzoi", "saluki", "whippet", "greyhound", "foxhound", "coonhound", "elkhound", "deerhound", "otterhound", "ridgeback", "basenji", "redbone", "bluetick"],
    "Terrier": ["terrier", "cairn", "airedale", "schnauzer", "scotch_terrier"],
    "Sporting": ["retriever", "spaniel", "setter", "pointer", "vizsla", "weimaraner"],
    "Toy": ["chihuahua", "pug", "pomeranian", "maltese", "pekinese", "shih_tzu", "papillon", "toy_poodle", "toy_terrier", "silky_terrier", "japanese_spaniel", "affenpinscher", "brabancon_griffon", "miniature_pinscher"],
    "Working": ["mastiff", "boxer", "great_dane", "saint_bernard", "bernese_mountain_dog", "greater_swiss_mountain_dog", "newfoundland", "great_pyrenees", "samoyed", "siberian_husky", "malamute", "eskimo_dog", "leonberg", "doberman", "kuvasz"],
    "Non-Sporting": ["french_bulldog", "boston_bull", "chow", "keeshond", "schipperke", "lhasa", "tibetan_terrier", "standard_poodle", "miniature_poodle"]
}

full_database = {}

for b in breeds:
    if b in curated:
        full_database[b] = curated[b]
        continue

    # Determine Group
    grp = "Working"
    for g, kw_list in group_keywords.items():
        if any(k in b for k in kw_list):
            grp = g
            break

    # Determine Size
    display = b.replace("_", " ").title()
    if grp == "Toy" or any(w in b for w in ["chihuahua", "pug", "maltese", "terrier", "papillon", "miniature"]):
        size = "Small"
        weight = "8 - 20 lbs"
        apt = 5
        energy = 3
    elif any(w in b for w in ["mastiff", "saint_bernard", "great_dane", "pyrenees", "newfoundland", "leonberg", "wolfhound"]):
        size = "Giant"
        weight = "100 - 160 lbs"
        apt = 1
        energy = 2
    elif grp in ["Working", "Sporting", "Herding"] or any(w in b for w in ["retriever", "shepherd", "setter", "hound", "rottweiler", "boxer"]):
        size = "Large"
        weight = "50 - 80 lbs"
        apt = 2
        energy = 4
    else:
        size = "Medium"
        weight = "30 - 50 lbs"
        apt = 3
        energy = 3

    # Origin
    if any(w in b for w in ["german", "schnauzer", "doberman", "rottweiler", "boxer", "dachshund"]):
        origin = "Germany 🇩🇪"
    elif any(w in b for w in ["english", "airedale", "beagle", "foxhound", "cocker", "norfolk", "norwich"]):
        origin = "United Kingdom 🇬🇧"
    elif any(w in b for w in ["irish", "kerry"]):
        origin = "Ireland 🇮🇪"
    elif any(w in b for w in ["scottish", "cairn", "scotch", "gordon", "collie"]):
        origin = "Scotland 🏴󠁧󠁢󠁳󠁣󠁴󠁿"
    elif any(w in b for w in ["french", "basset", "briard", "papillon"]):
        origin = "France 🇫🇷"
    elif any(w in b for w in ["chihuahua", "mexican"]):
        origin = "Mexico 🇲🇽"
    elif any(w in b for w in ["husky", "samoyed", "borzoi"]):
        origin = "Russia 🇷🇺"
    elif any(w in b for w in ["tibetan", "lhasa", "chow", "shih_tzu", "pekinese"]):
        origin = "China / Tibet 🇨🇳"
    elif any(w in b for w in ["australian", "kelpie", "dingo"]):
        origin = "Australia 🇦🇺"
    elif any(w in b for w in ["japanese"]):
        origin = "Japan 🇯🇵"
    else:
        origin = "Europe / Americas 🌍"

    full_database[b] = {
        "display_name": display,
        "akc_group": grp,
        "origin": origin,
        "size": size,
        "weight_lbs": weight,
        "life_expectancy": "10 - 14 years",
        "temperament": "Alert, Intelligent, Loyal, Trainable",
        "description": f"The {display} is a distinguished {grp.lower()} breed admired for its unique character and heritage.",
        "energy": energy,
        "trainability": 4 if grp in ["Herding", "Sporting"] else 3,
        "kid_friendly": 4,
        "apartment_friendly": apt,
        "grooming": 4 if any(w in b for w in ["poodle", "komondor", "terrier", "setter", "retriever"]) else 2,
        "fun_fact": f"The {display} has a long and storied ancestry recognized by major international kennel organizations.",
        "lookalike": {
            "name": f"Similar {grp} Breeds",
            "tip": f"Look at the ear posture, tail shape, and coat texture to differentiate the {display}."
        }
    }

with open("backend/model/breed_info.json", "w") as f:
    json.dump(full_database, f, indent=2)

print(f"✅ Generated rich breed database for {len(full_database)} breeds in backend/model/breed_info.json")
